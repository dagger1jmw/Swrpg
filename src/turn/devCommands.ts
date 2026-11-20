// Dev sandbox commands (Jared, D-180): dev mode (?dev=1) and test campaigns only. Typed in the chat box, handled in code
// before the intent call, with no AI call. Each command emits normal engine events through applyEvents (dev-only events
// exist only where no normal event sets the value, and refuse outside a test campaign themselves), so the rules stay
// the same. Each command is a turn record with a short "[DEV]" line, so it shows in the transcript and is in the save.
import type { Choice } from '../ai/schemas/compose';
import type { Intent, RequestedSpan } from '../ai/schemas/intent';
import { CANON_NPCS, type CanonNpc } from '../data/canonNpcs';
import { COMBAT_STAKES } from '../data/progression.config';
import { moraleFor, STRIKE_INTENTS, type SPARRING_MODES, type StrikeIntent } from '../data/combat.config';
import { BODY_PARTS, SEVERITIES, type BodyPart, type Severity } from '../data/health.config';
import { MINION_KINDS } from '../data/npcGen.config';
import type { WeaponKind } from '../data/health.config';
import { FORM_IDS, SKILL_BY_ID } from '../data/skills';
import { TERRAIN_IDS } from '../data/terrain';
import { absDayFromDate, dateFromAbsDay, isValidDate, type CalendarDate } from '../engine/calendar';
import { selectCharacter, selectIsTestCharacter, selectPath } from '../features/character/selectors';
import { selectNow } from '../features/clock/selectors';
import { resolveLocationRef } from '../features/locations/selectors';
import { selectPacingLevel } from '../features/pacing/selectors';
import { selectLevelExact } from '../features/progression/selectors';
import { makeEnvelope } from '../persist/envelope';
import type { CampaignRecord, Storage, TranscriptEntry } from '../persist/storage';
import { advanceTime } from '../state/advanceTime';
import { applyEvents, type AppliedEvent, type RejectedEvent } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import type { EventSource, Registry } from '../state/types';
import { combatDraft } from './combatTurn';
import { currentTarget, PART_TEXT, type DuelState } from '../engine/duel';
import { HAZARD_TYPES } from '../data/health.config';
import type { Session } from './pipeline';
import type { TurnRecord } from './record';
import { resolveTurn, type TurnDraft } from './resolve';
import { selectPlayerFightingLevel } from '../features/combat/selectors';
export { pendingScenario } from './devScenario';

/** The help text: every command, one line each. Unknown commands show it. */
export const DEV_HELP: readonly string[] = [
  '/fight <count> <kind or level> [at <gap>] [terrain <tags>] [stakes spar|skirmish|serious|lethal] [mode training|controlled|academy] [weapon <kind>] [alive]: a fight now, with the duel panel. alive: the opponents want you alive and subdue when they can (D-262). weapon (minion groups): scattergun, slugpistol, slugrifle, pistol, rifle, heavy, melee, saber. Kinds: duelist, a minion kind (b1, b2, militia, thug, brawler, trooper, elite, mandalorian, droideka, beast, acolyte), a level, or canon:<name>. Examples: /fight 1 duelist at -10, /fight 6 b1 terrain forest, /fight 1 canon:malgus stakes lethal',
  '/spar <partner level, at <gap>, or canon:<name>> [mode training|controlled|academy]: a sparring session, played out',
  '/wound <location> <severity>: a wound (torso, head, left arm, right leg, left hand ...; minor, moderate, severe, critical, mortal). /heal [all]: wounds and Vitality back (all: lasting injuries too). Fatigue is separate: /fatigue physical 0 (and force, mental)',
  '/set <skill> <level>, /e <form> <value>, /ci <ability> <value>: stats directly',
  '/fatigue <physical|mental|force> <value>: a fatigue meter as a fraction of capacity (0 fresh, 1 at capacity, up to 5; the body collapses past 4 in a fight)',
  '/sever <limb>: a severed limb (left leg, right arm, left hand ...), out of a fight; it becomes a lasting injury with the path’s prosthetic',
  '/exchanges <n>: in a fight, resolve up to n exchanges with the current stance (stops when the fight ends). /exchanges to <n>: the counter to n with no rolls, then on to the end (to 195 reaches the 200-exchange cap)',
  '/hazard <fall|fire|explosion|crash|poison|exposure|impact> <1-3> [end]: the narrator’s hazardOccurred as the narrator sends it; with end (in a fight), also its environmentCollapse interruption',
  '/stakes <serious|lethal|skirmish>: the current fight’s stakes. /archetype <id>: the current opponent’s archetype (named opponents; the captor and fate rules)',
  '/intent <kill|disarm|capture> [all]: the current opponent’s strike intent, or every opponent’s (D-260; capture only with a subduing means, D-262)',
  '/skip <amount> <days|weeks|months|years>: a montage (or time skip) on the routine',
  '/time <time of day, or year BBY|ABY [month] [day] [time]>: the clock forward to then. /place <location>: move there (created when new)',
  '/scenario <text>: the next narration starts exactly in that situation',
  '/truce [terms]: the opponent offers a truce (the Accept truce button answers it). /fall: the fight\'s terrain accidents are rolled now',
  '/simulate 503 <n>: the next n AI requests fail as HTTP 503 (busy), to see the retries, the busy note and the next model (D-250); 0 clears it',
  '/help: this list',
];

const MINION_ALIASES: Readonly<Record<string, string>> = {
  b1: 'battleDroid', battledroid: 'battleDroid', droid: 'battleDroid', droids: 'battleDroid',
  b2: 'superBattleDroid', superbattledroid: 'superBattleDroid',
  elite: 'eliteTrooper', elitetrooper: 'eliteTrooper', commando: 'eliteTrooper',
  mando: 'mandalorian', mandalorians: 'mandalorian',
  acolyte: 'sithAcolyte', sithacolyte: 'sithAcolyte',
  clone: 'cloneTrooper', clones: 'cloneTrooper', storm: 'stormtrooper', stormtroopers: 'stormtrooper', wardroid: 'warDroid', wardroids: 'warDroid',
  ...Object.fromEntries(MINION_KINDS.flatMap((k) => [[k.id.toLowerCase(), k.id], [`${k.id.toLowerCase()}s`, k.id]])),
};
const MODE_ALIASES: Readonly<Record<string, (typeof SPARRING_MODES)[number]>> = { training: 'trainingSaber', trainingsaber: 'trainingSaber', controlled: 'controlled', academy: 'academy' };
const METER_ALIASES: Readonly<Record<string, 'p' | 'm' | 'f'>> = { p: 'p', physical: 'p', body: 'p', m: 'm', mental: 'm', mind: 'm', f: 'f', force: 'f' };
/** A wound's W by severity: the middle of its band (health §5). */
const SEVERITY_W: Readonly<Record<Severity, number>> = { minor: 5, moderate: 15, severe: 27, critical: 42, mortal: 55 };
const TIMES_OF_DAY: Readonly<Record<string, number>> = { midnight: 0, dawn: 6 * 3600, morning: 8 * 3600, noon: 12 * 3600, midday: 12 * 3600, afternoon: 15 * 3600, evening: 19 * 3600, dusk: 19 * 3600, night: 22 * 3600 };
const SPAN_UNIT: Readonly<Record<string, RequestedSpan['unit']>> = { d: 'days', day: 'days', days: 'days', w: 'weeks', week: 'weeks', weeks: 'weeks', m: 'months', mo: 'months', month: 'months', months: 'months', y: 'years', year: 'years', years: 'years' };
const MAX_DUELISTS = 4;
/** /fatigue's top value (D-241): past the physical collapse at 4x (D-208). */
const DEV_FATIGUE_MAX = 5;
/** /fight weapon words for a minion group (D-215). */
const WEAPON_ALIASES: Readonly<Record<string, WeaponKind>> = { scattergun: 'scatterGun', scatter: 'scatterGun', slugpistol: 'slugPistol', slug: 'slugPistol', slugrifle: 'slugRifle', pistol: 'blasterPistol', blaster: 'blasterPistol', blasterpistol: 'blasterPistol', rifle: 'blasterRifle', blasterrifle: 'blasterRifle', heavy: 'heavy', melee: 'melee', vibroblade: 'melee', saber: 'lightsaber', lightsaber: 'lightsaber', unarmed: 'unarmed' };
/**
 * Where a /fight place word puts the scene (D-215): an in-world place, never a "sandbox", "testing chamber" or
 * "simulation" (the narrator read pass 2's "Ruins (dev sandbox)" as a combat simulation). Planets that exist in every era.
 */
export const DEV_PLACE_NAMES: Readonly<Record<string, string>> = {
  forest: 'a forest clearing on Dantooine', jungle: 'a jungle on Yavin 4', swamp: 'a swamp on Dagobah', cave: 'a cave in the hills of Dantooine', ruins: 'ancient ruins on Dantooine', desert: 'the Dune Sea on Tatooine', plains: 'the grasslands of Dantooine', rooftop: 'a rooftop on Nar Shaddaa', hangar: 'an abandoned hangar on Nar Shaddaa', corridor: 'a starship corridor', temple: 'an old temple hall on Dantooine', 'training hall': 'a training hall', salle: 'a dueling salle', dojo: 'a training hall', 'sparring ring': 'a sparring ring', academy: 'an academy training floor', arena: 'a fighting pit on Nar Shaddaa', office: 'an office on Coruscant', ice: 'an ice field on Hoth', glacier: 'a glacier on Hoth', 'ilum caves': 'the ice caves of Ilum', hoth: 'an ice field on Hoth',
};
/** A fight with no place word in a scene with no place, or a leftover dev place, is set here (D-215). */
export const DEV_DEFAULT_PLACE = 'an abandoned hangar on Nar Shaddaa';
/**
 * The years a Sith Empire exists (D-216; pass 2 had "sithEmpire" duelists in 22 BBY and 25 ABY): the Great Hyperspace
 * War's empire, Revan's, the Sith Empire of the Great Galactic War and the Cold War, and Krayt's empire of the Legacy era.
 * Outside them a dev Sith duelist is of the Sith, not the Empire.
 */
export const SITH_EMPIRE_YEARS: readonly (readonly [number, number])[] = [[-5000, -4989], [-3959, -3955], [-3681, -3627], [130, 140]];
export const sithFactionAt = (year: number): 'sithEmpire' | 'sith' => (SITH_EMPIRE_YEARS.some(([a, b]) => year >= a && year < b) ? 'sithEmpire' : 'sith');
const isDevPlace = (name: string | undefined): boolean => !name || /dev sandbox|testing|simulation|sandbox/i.test(name);
/**
 * Place words for /fight terrain (design default, D-180): each stands for the terrain tags such a place has, with
 * throwables wherever an outdoor or wrecked place has them (fallen timber, loose rock, debris, machinery).
 */
export const TERRAIN_ALIASES: Readonly<Record<string, readonly string[]>> = {
  forest: ['unevenGround', 'cover', 'fallenTimber', 'looseRock'],
  jungle: ['unevenGround', 'cover', 'fallenTimber', 'looseRock'],
  swamp: ['slippery', 'unevenGround', 'fallenTimber'],
  cave: ['confined', 'unevenGround', 'looseRock'],
  ruins: ['debris', 'cover', 'looseRock'],
  desert: ['open', 'unevenGround', 'looseRock'],
  plains: ['open'],
  rooftop: ['ledge', 'highGround', 'machinery'],
  hangar: ['flatFloor', 'crates', 'machinery'],
  // Indoor practice and working spaces (Jared, D-186): good floors, still the flat-floor accident roll.
  corridor: ['confined', 'flatFloor'],
  temple: ['flatFloor'],
  'training hall': ['flatFloor'],
  salle: ['flatFloor'],
  dojo: ['flatFloor'],
  'sparring ring': ['flatFloor'],
  academy: ['flatFloor'],
  arena: ['flatFloor'],
  office: ['flatFloor'],
  // Ice (Jared, D-184): chunks to throw, slippery footing (the fall roll, -1 to take position), uneven ground.
  ice: ['iceChunks', 'slippery', 'unevenGround'],
  glacier: ['iceChunks', 'slippery', 'unevenGround'],
  'ilum caves': ['iceChunks', 'slippery', 'unevenGround'],
  hoth: ['iceChunks', 'slippery', 'unevenGround'],
};

const squash = (x: string): string => x.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** True when the text is a dev command (the chat box sends it here, not to the intent call, in dev mode). */
export const isDevCommand = (text: string): boolean => /^\/[a-z]/i.test(text.trim());

/** A skill id from the player's words: the id, or the skill's name ("Force Push", "shii-cho"). */
export function skillFromWords(words: string): string | null {
  const q = squash(words);
  for (const [id, def] of SKILL_BY_ID) if (squash(id) === q || squash(def.name) === q) return id;
  return null;
}

function partFromWords(words: string): BodyPart | null {
  const q = squash(words);
  const short: Record<string, BodyPart> = { larm: 'leftArm', rarm: 'rightArm', lleg: 'leftLeg', rleg: 'rightLeg', lhand: 'leftHand', rhand: 'rightHand', chest: 'torso', body: 'torso' };
  return BODY_PARTS.find((p) => squash(p) === q) ?? short[q] ?? null;
}

function canonFromWords(q0: string): CanonNpc | null {
  const q = squash(q0);
  return CANON_NPCS.find((c) => squash(c.canonId.replace(/^lore:/, '')) === q) ?? CANON_NPCS.find((c) => squash(c.name) === q) ?? CANON_NPCS.find((c) => squash(c.canonId).includes(q) || squash(c.name).includes(q)) ?? null;
}

/**
 * The player's reference level for a gap: the main form, else the best form, else the weapon skill they fight with
 * (pass 4 issue 15: a smuggler's "/fight 1 duelist at +10" read "your form 0.0" and fielded a level-10 Sith Lord).
 */
export function playerFormLevel(s: GameState): number {
  const main = selectCharacter(s).mainFormId;
  if (main) return selectLevelExact(s, main);
  const best = Math.max(0, ...FORM_IDS.map((f) => selectLevelExact(s, f)));
  return best > 0 ? best : selectPlayerFightingLevel(s);
}

/** Time of day in seconds from "08:00", "8:30pm", "8am", "noon". */
function timeFromWords(w: string): number | null {
  const named = TIMES_OF_DAY[w.toLowerCase()];
  if (named !== undefined) return named;
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm)?$/i.exec(w);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59 || (!m[2] && !ap)) return null;
  return h * 3600 + min * 60;
}

export interface DevOutcome {
  ok: boolean;
  state: GameState;
  /** The "[DEV]" line for the transcript. */
  line: string;
  applied: AppliedEvent[];
  rejected: RejectedEvent[];
  notices: string[];
  report: string[];
  /** Set when the command ran a turn's draft pieces (a fight's start, a montage, a clock advance). */
  draft: Partial<Pick<TurnDraft, 'combat' | 'jump' | 'timeAdvanced' | 'pacingLevel' | 'training' | 'checks'>>;
  /** /simulate 503 n (D-250): the caller arms its provider so the next n requests return 503. */
  simulate503?: number;
}
/** At most this many simulated 503s at once: 5 is a full narrative fallback (3 retries, the next model, its failure). */
export const SIMULATE_503_MAX = 10;

/**
 * Runs one dev command against the state (pure). Refused outside a test campaign; an unknown command shows the help.
 * The caller records the outcome as a turn (commitDevCommand).
 */
export function runDevCommand(registry: Registry<GameState>, initial: GameState, text: string): DevOutcome {
  let state = initial;
  const applied: AppliedEvent[] = [];
  const rejected: RejectedEvent[] = [];
  const notices: string[] = [];
  const report: string[] = [];
  let draft: DevOutcome['draft'] = {};
  const out = (ok: boolean, line: string): DevOutcome => ({ ok, state: ok ? state : initial, line: `[DEV] ${line}`, applied: ok ? applied : [], rejected, notices, report, draft: ok ? draft : {} });
  const fail = (why: string): DevOutcome => out(false, `${text.trim()}: ${why}`);
  const apply = (events: unknown[], source: EventSource): AppliedEvent[] => {
    const r = applyEvents(registry, state, events, { source });
    state = r.state;
    applied.push(...r.applied);
    rejected.push(...r.rejected);
    notices.push(...r.notices);
    for (const a of r.applied) report.push(...a.notes);
    return r.applied;
  };
  const refused = (): string | null => (rejected.length ? rejected.map((r) => r.reason).join('; ') : null);
  /** Moves the scene to a place, created when new (/place, and /fight's place words). Returns why it failed, or null. */
  const movePlace = (name: string): string | null => {
    let id = resolveLocationRef(state, name);
    if (!id) {
      apply([{ type: 'locationCreatedByPlayer', name }], 'player');
      id = resolveLocationRef(state, name);
      if (!id) return refused() ?? 'could not create the place';
    }
    apply([{ type: 'locationChanged', locationRef: id }], 'dev');
    return refused();
  };

  if (!selectIsTestCharacter(initial)) return fail('dev commands work only in a test campaign (the dev test start, ?dev=1)');
  const words = text.trim().split(/\s+/);
  const cmd = words[0]!.slice(1).toLowerCase();
  const args = words.slice(1);
  const inFight = initial.combat.active !== null;

  switch (cmd) {
    case 'help':
      return out(true, `commands:\n${DEV_HELP.join('\n')}`);

    case 'simulate': {
      // D-250: the next n model requests fail as 503 (the app arms its provider; nothing in the save changes).
      const n = Number(args[1]);
      if (args[0] !== '503' || !Number.isInteger(n) || n < 0 || n > SIMULATE_503_MAX) return fail(`/simulate 503 <0-${SIMULATE_503_MAX}>`);
      return { ...out(true, n ? `the next ${n} AI request${n > 1 ? 's' : ''} return 503 (simulated; retries and the fallback follow as for a real one)` : 'no simulated 503s'), simulate503: n };
    }

    case 'scenario': {
      const scenario = args.join(' ').trim();
      if (!scenario) return fail('give the situation, e.g. /scenario a forest on Dantooine, ambushed by four Mandalorians');
      return out(true, `scenario for the next narration: ${scenario}`);
    }

    case 'fight':
    case 'spar': {
      if (inFight) return fail('a fight is already in progress (Resolve to end, or Stop sparring, first)');
      const kw = new Set(['at', 'terrain', 'stakes', 'mode', 'weapon', 'alive']);
      // The opponents want the player alive (D-262): they subdue when their loadout can.
      let alive = false;
      let i = 0;
      let count = 1;
      if (cmd === 'fight') {
        count = Number(args[i++]);
        if (!Number.isInteger(count) || count < 1) return fail('the count comes first, e.g. /fight 2 duelist');
      }
      let kind = args[i] && !kw.has(args[i]!.toLowerCase()) ? args[i++]! : cmd === 'spar' ? 'duelist' : '';
      if (!kind) return fail('name the kind, e.g. /fight 1 duelist');
      let gap: number | null = null;
      const terrain: string[] = [];
      let stakes: string = cmd === 'spar' ? 'spar' : 'serious';
      let mode: string | null = null;
      let weapon: WeaponKind | null = null;
      while (i < args.length) {
        const k = args[i++]!.toLowerCase();
        if (k === 'at') {
          gap = Number(args[i++]);
          if (!Number.isFinite(gap)) return fail('at takes a level gap, e.g. at -10');
        } else if (k === 'terrain') {
          while (i < args.length && !kw.has(args[i]!.toLowerCase())) {
            // Two-word place names ("Ilum caves") first.
            const two = `${args[i]!} ${args[i + 1] ?? ''}`.toLowerCase().replace(/,/g, '');
            if (TERRAIN_ALIASES[two]) {
              terrain.push(two);
              i += 2;
            } else terrain.push(...args[i++]!.split(',').filter(Boolean));
          }
        } else if (k === 'stakes') {
          stakes = (args[i++] ?? '').toLowerCase();
          if (!(COMBAT_STAKES as readonly string[]).includes(stakes)) return fail(`stakes: ${COMBAT_STAKES.join(', ')}`);
        } else if (k === 'weapon') {
          const w = WEAPON_ALIASES[(args[i++] ?? '').toLowerCase()];
          if (!w) return fail(`weapon: ${Object.keys(WEAPON_ALIASES).join(', ')}`);
          weapon = w;
        } else if (k === 'alive') alive = true;
        else if (k === 'mode') {
          const m = MODE_ALIASES[(args[i++] ?? '').toLowerCase()];
          if (!m) return fail('mode: training, controlled or academy');
          mode = m;
        } else return fail(`unexpected "${k}"`);
      }
      if (cmd === 'spar') stakes = 'spar';
      if (mode && stakes !== 'spar') return fail('mode is for a spar (stakes spar or /spar)');
      const found = terrain.map((t) => TERRAIN_ALIASES[t.toLowerCase()] ?? (TERRAIN_IDS.find((id) => squash(id) === squash(t)) ? [TERRAIN_IDS.find((id) => squash(id) === squash(t))!] : null));
      if (found.includes(null)) return fail(`unknown terrain ${terrain.filter((_, j) => found[j] === null).join(', ')} (tags: ${TERRAIN_IDS.join(', ')}; places: ${Object.keys(TERRAIN_ALIASES).join(', ')})`);
      const tags = [...new Set(found.flat() as string[])];
      const opponentRefs: string[] = [];
      const minionGroups: { kind: string; count: number; wantAlive?: boolean }[] = [];
      const own = selectPath(state);
      const asLevel = Number(kind);
      const minion = MINION_ALIASES[kind.toLowerCase()];
      let who: string;
      if (kind.toLowerCase().startsWith('canon:')) {
        if (count !== 1) return fail('one canon opponent at a time');
        const c = canonFromWords(kind.slice(6));
        if (!c) return fail(`no canon figure matches "${kind.slice(6)}"`);
        const age = c.birthBby + dateFromAbsDay(selectNow(state).day).year;
        if (age < 1) return fail(`${c.name} is not born yet at this date`);
        if (c.deathBby !== undefined && -dateFromAbsDay(selectNow(state).day).year < c.deathBby) return fail(`${c.name} is dead at this date`);
        apply([{ type: 'npcIntroduced', name: c.name, species: c.speciesId, faction: c.faction, role: c.role, ageApprox: Math.round(age), description: 'here to fight' }], 'dev');
        const id = Object.values(state.npcs.byId).find((n) => n.name === c.name)?.id;
        if (!id) return fail(refused() ?? 'could not introduce the canon figure');
        apply([{ type: 'npcCanonLinked', npcRef: id, canonId: c.canonId }], 'engine');
        opponentRefs.push(id);
        who = c.name;
      } else if (minion) {
        if (gap !== null) report.push('at is ignored for minions: their levels come from their kind and grade');
        minionGroups.push({ kind: minion, count, ...(weapon ? { weapon } : {}), ...(alive ? { wantAlive: true } : {}) });
        who = `${count} ${MINION_KINDS.find((k) => k.id === minion)!.label}${count > 1 ? 's' : ''}`;
      } else if (kind.toLowerCase() === 'duelist' || kind.toLowerCase() === 'partner' || (Number.isFinite(asLevel) && asLevel > 0)) {
        if (count > MAX_DUELISTS) return fail(`at most ${MAX_DUELISTS} named duelists`);
        const level = Number.isFinite(asLevel) && asLevel > 0 ? asLevel : Math.round((playerFormLevel(state) + (gap ?? 0)) * 10) / 10;
        if (level < 1) return fail(`a level of ${level} is too low (the reference is your form at ${playerFormLevel(state).toFixed(1)})`);
        // A sparring partner walks the player's path; an opponent the other one.
        const ally = stakes === 'spar' ? own !== 'sith' : own === 'sith';
        const base = stakes === 'spar' ? 'Sparring partner' : 'Duelist';
        for (let n = 0; n < count; n++) {
          let k = 1;
          while (Object.values(state.npcs.byId).some((x) => x.name === `${base} ${k}`)) k++;
          const name = `${base} ${k}`;
          apply([{ type: 'npcIntroduced', name, species: 'human', faction: ally ? 'jediOrder' : sithFactionAt(dateFromAbsDay(selectNow(state).day).year), role: ally ? 'jediKnight' : 'sithLord', ageApprox: 35, description: stakes === 'spar' ? 'a sparring partner' : 'an armed duelist who means to fight' }], 'dev');
          const id = Object.values(state.npcs.byId).find((x) => x.name === name)?.id;
          if (!id) return fail(refused() ?? 'could not introduce the duelist');
          apply([{ type: 'devNpcLevelsSet', npcRef: id, level }], 'dev');
          if (refused()) return fail(refused()!);
          opponentRefs.push(id);
        }
        who = `${count} ${base.toLowerCase()}${count > 1 ? 's' : ''} at ${level.toFixed(1)} (your level ${playerFormLevel(state).toFixed(1)})`;
      } else return fail(`unknown kind "${kind}" (duelist, a level, a minion kind, or canon:<name>)`);
      if (weapon && !minion) return fail('weapon is for a minion group (e.g. /fight 4 mandalorian weapon scattergun)');
      // A place word moves the scene there, so the narrator does not set the fight in the old place (issue 21).
      // In-world places only (D-215): a place word sets its place; with none, a scene with no place (or a leftover dev
      // place) gets the neutral default, and the scenario's place is kept.
      const placeWord = terrain.find((t) => TERRAIN_ALIASES[t.toLowerCase()]);
      const here = state.locations.currentId ? state.locations.byId[state.locations.currentId]?.name : undefined;
      const target = placeWord ? (DEV_PLACE_NAMES[placeWord.toLowerCase()] ?? DEV_DEFAULT_PLACE) : isDevPlace(here) ? DEV_DEFAULT_PLACE : null;
      if (target && target !== here) {
        const moved = movePlace(target);
        if (moved) return fail(moved);
      }
      // Earlier dev opponents leave the scene (pass 4 issue 15: "Duelist 9 pauses nearby" in the 37th dev duel), unless a
      // fate choice about them is still open.
      const openFate = new Set(state.combat.fates.map((f) => f.npcId));
      const stay = state.pacing.scene.presentNpcIds.filter((id) => opponentRefs.includes(id) || !state.npcs.byId[id]?.devLevels || openFate.has(id));
      if (stay.length !== state.pacing.scene.presentNpcIds.length) state = { ...state, pacing: { ...state.pacing, scene: { ...state.pacing.scene, presentNpcIds: stay } } };
      const before = state;
      apply([{ type: 'fightBegun', fromPending: false, opponentRefs, minionGroups, stakes, terrainTags: tags, ...(mode ? { sparringMode: mode } : {}), ...(stakes === 'spar' ? { playOut: true } : {}), ...(alive && opponentRefs.length ? { wantAliveRefs: opponentRefs } : {}) }], 'engine');
      // A dying player's fight ends at once (D-242): begun and over in the same command.
      const endedAtOnce = !state.combat.active && state.combat.last !== null && state.combat.last.id !== before.combat.last?.id;
      if (!state.combat.active && !endedAtOnce) return fail(refused() ?? 'the fight did not begin');
      if (endedAtOnce) {
        draft = { combat: combatDraft(before, state, true, report), pacingLevel: selectPacingLevel(state) };
        return out(true, `fight begun and over at once: ${who}; ${state.combat.last!.outcome} (${state.combat.last!.reason})`);
      }
      const active = state.combat.active!;
      // The kind that was fielded, not the one asked for (D-242; pass 3: "4 clone troopers" over the era note's line troopers).
      if (minion) {
        const fielded = Object.values(active.meta).find((m) => m.minionKind)?.minionKind;
        const label = MINION_KINDS.find((k) => k.id === fielded)?.label;
        if (label) who = `${count} ${label}${count > 1 ? 's' : ''}`;
      }
      draft = { combat: combatDraft(before, state, true, report), pacingLevel: selectPacingLevel(state) };
      kind = active.sparring ? `${stakes} (${active.sparring})` : stakes;
      return out(true, `${cmd === 'spar' ? 'sparring session' : 'fight'} begun: ${who}, ${kind}${tags.length ? `, terrain ${tags.join(', ')}` : ''}`);
    }

    case 'truce': {
      if (!inFight) return fail('no fight in progress');
      apply([{ type: 'truceOffered', why: args.join(' ').trim() || 'the opponent offers to stop the fight' }], 'dev');
      if (refused()) return fail(refused()!);
      return out(true, 'the opponent offers a truce');
    }

    case 'fall': {
      if (!inFight) return fail('no fight in progress');
      apply([{ type: 'devTerrainRolled' }], 'dev');
      if (refused()) return fail(refused()!);
      return out(true, 'terrain accidents rolled');
    }

    case 'wound': {
      if (inFight) return fail('not during a fight (the duel owns the wounds)');
      const sev = args[args.length - 1]?.toLowerCase() as Severity | undefined;
      if (!sev || !SEVERITIES.includes(sev)) return fail(`the severity comes last: ${SEVERITIES.join(', ')}`);
      const part = partFromWords(args.slice(0, -1).join(' '));
      if (!part) return fail(`unknown location (${BODY_PARTS.join(', ')})`);
      apply([{ type: 'healthSynced', vitalityLost: state.health.vitalityLost, addWounds: [{ id: 'dev', part, severity: sev, W: SEVERITY_W[sev], stabilized: false, healProgress: 0, day: selectNow(state).day, source: 'dev command' }], cause: 'dev command' }], 'engine');
      if (refused()) return fail(refused()!);
      return out(true, `${sev} wound to the ${PART_TEXT[part] ?? part}`);
    }

    case 'heal': {
      if (inFight) return fail('not during a fight (the duel owns the wounds)');
      const all = args[0]?.toLowerCase() === 'all';
      apply([{ type: 'devHealed', ...(all ? { lasting: true } : {}) }], 'dev');
      if (refused()) return fail(refused()!);
      return out(true, `healed${all ? ' (lasting injuries too)' : ''}`);
    }

    case 'set':
    case 'e':
    case 'ci': {
      const value = Number(args[args.length - 1]);
      if (args.length < 2 || !Number.isFinite(value)) return fail(`/${cmd} <${cmd === 'set' ? 'skill' : cmd === 'e' ? 'form' : 'ability'}> <value>`);
      const id = skillFromWords(args.slice(0, -1).join(' '));
      if (!id) return fail(`unknown skill "${args.slice(0, -1).join(' ')}"`);
      const v = Math.max(0, Math.min(120, value));
      apply([cmd === 'set' ? { type: 'devSkillSet', skillId: id, level: v } : cmd === 'e' ? { type: 'devESet', formId: id, value: v } : { type: 'devCISet', abilityId: id, value: v }], 'dev');
      if (refused()) return fail(refused()!);
      return out(true, `${cmd === 'set' ? `${id} level` : cmd === 'e' ? `E ${id}` : `CI ${id}`} ${v}${inFight && cmd === 'set' ? ' (the fight in progress keeps its levels; the next fight uses it)' : ''}`);
    }

    case 'fatigue': {
      const meter = METER_ALIASES[(args[0] ?? '').toLowerCase()];
      const v = Number(args[1]);
      if (!meter || !Number.isFinite(v)) return fail('/fatigue <physical|mental|force> <value>');
      // Up to 5 (D-241); a value out of range is said, not silently clamped (pass 3: "/fatigue 3.9" answered "at 3").
      const f = Math.max(0, Math.min(DEV_FATIGUE_MAX, v));
      apply([{ type: 'devFatigueSet', meter, fraction: f }], 'dev');
      if (refused()) return fail(refused()!);
      return out(true, `${meter === 'p' ? 'physical' : meter === 'm' ? 'mental' : 'Force'} fatigue at ${f}${f !== v ? ` (asked ${v}; the range is 0 to ${DEV_FATIGUE_MAX})` : ''}`);
    }

    case 'sever': {
      if (inFight) return fail('not during a fight (the duel owns the wounds)');
      const part = partFromWords(args.join(' '));
      if (!part || !/(Arm|Leg|Hand)$/.test(part)) return fail('a limb: left arm, right arm, left hand, right hand, left leg, right leg');
      apply([{ type: 'healthSynced', vitalityLost: state.health.vitalityLost, addWounds: [{ id: 'dev', part, severity: 'severe', W: SEVERITY_W.severe, stabilized: true, healProgress: 0, day: selectNow(state).day, source: 'dev command', severed: true }], cause: 'dev command' }], 'engine');
      if (refused()) return fail(refused()!);
      return out(true, `${PART_TEXT[part] ?? part} severed`);
    }

    case 'exchanges': {
      if (!inFight) return fail('no fight in progress');
      // "/exchanges to 195": the counter to 195 with no rolls, then exchanges to the cap or the end (D-241).
      const to = args[0]?.toLowerCase() === 'to' ? Number(args[1]) : null;
      const n = to !== null ? 400 : Number(args[0]);
      if (to !== null && (!Number.isInteger(to) || to < 0 || to > 399)) return fail('/exchanges to <0-399>');
      if (!Number.isInteger(n) || n < 1 || n > 400) return fail('/exchanges <1-400>, or /exchanges to <n>');
      const before = state;
      apply([{ type: 'devExchanges', count: n, ...(to !== null ? { setTo: to } : {}) }], 'dev');
      if (refused()) return fail(refused()!);
      draft = { combat: combatDraft(before, state, false, report), pacingLevel: selectPacingLevel(state) };
      return out(true, state.combat.active ? `${n} exchanges asked; the fight goes on` : `the fight ended: ${state.combat.last?.outcome ?? '?'} (${state.combat.last?.reason ?? '?'})`);
    }

    case 'hazard': {
      const type = (args[0] ?? '').toLowerCase();
      const sev = Number(args[1]);
      const end = args[2]?.toLowerCase() === 'end';
      if (!(HAZARD_TYPES as readonly string[]).includes(type) || ![1, 2, 3].includes(sev)) return fail(`/hazard <${HAZARD_TYPES.join('|')}> <1-3> [end]`);
      if (end && !inFight) return fail('end needs a fight in progress');
      // The narrator's events exactly as a reply carries them (source ai), in one batch so an interruption sees its cause (D-196, D-217).
      const before = state;
      const events: unknown[] = [{ type: 'hazardOccurred', hazard: type, severityHint: sev, cause: `dev /hazard ${type}` }];
      if (end) events.push({ type: 'combatEnded', reason: 'interrupted', category: 'environmentCollapse', why: `the ${type} brings the place down` });
      apply(events, 'ai');
      if (refused()) return fail(refused()!);
      if (inFight) draft = { combat: combatDraft(before, state, false, report), pacingLevel: selectPacingLevel(state) };
      return out(true, `the narrator's ${type} (severity ${sev})${end ? ' ends the fight' : inFight ? ' during the fight (no damage unless it ends it, D-212)' : ' (applied next turn, D-29)'}`);
    }

    case 'stakes': {
      if (!inFight) return fail('no fight in progress');
      const stakes = (args[0] ?? '').toLowerCase();
      apply([{ type: 'devStakesSet', stakes }], 'dev');
      if (refused()) return fail(refused()!);
      return out(true, `stakes ${stakes}`);
    }

    case 'archetype': {
      if (!inFight) return fail('no fight in progress');
      const duel = state.combat.active!.duel as DuelState;
      const target = currentTarget(duel);
      const npcId = target ? state.combat.active!.meta[target.id]?.npcId : null;
      if (!npcId) return fail('the current opponent is a minion: its archetype is its kind’s (target a named opponent)');
      apply([{ type: 'devNpcArchetypeSet', npcRef: npcId, archetype: args[0] ?? '' }], 'dev');
      if (refused()) return fail(refused()!);
      // The fighter in the fight takes the archetype's morale too (D-256), so a surrender can be tested on demand.
      const act = state.combat.active!;
      const d = act.duel as DuelState;
      state = { ...state, combat: { ...state.combat, active: { ...act, duel: { ...d, opponents: d.opponents.map((o) => (o.id === target!.id ? { ...o, morale: moraleFor(args[0] ?? '') } : o)) } } } };
      return out(true, `${target!.name}: archetype ${args[0]}`);
    }

    case 'intent': {
      // D-260: an opponent's strike intent, the current one or all of them (dev; the scene sets it in play).
      if (!inFight) return fail('no fight in progress');
      const want = (args[0] ?? '').toLowerCase() as StrikeIntent;
      if (!STRIKE_INTENTS.includes(want)) return fail(`/intent <${STRIKE_INTENTS.join('|')}> [all]`);
      const act = state.combat.active!;
      const d = act.duel as DuelState;
      const cur = currentTarget(d);
      const all = args[1]?.toLowerCase() === 'all';
      // Capture needs a subduing means (D-262): an opponent without one keeps its intent.
      const cannot = d.opponents.filter((o) => (all || o.id === cur?.id) && want === 'capture' && !o.subdue).map((o) => o.name);
      state = { ...state, combat: { ...state.combat, active: { ...act, duel: { ...d, opponents: d.opponents.map((o) => ((all || o.id === cur?.id) && !(want === 'capture' && !o.subdue) ? { ...o, intent: want } : o)) } } } };
      return out(true, `${all ? 'every opponent' : (cur?.name ?? 'the opponent')} ${want === 'capture' ? 'fights to capture' : `strikes to ${want}`}${cannot.length ? ` (no way to subdue, unchanged: ${cannot.join(', ')})` : ''}`);
    }

    case 'skip': {
      if (inFight) return fail('not during a fight');
      const joined = args.join(' ').toLowerCase();
      const m = /^(\d+(?:\.\d+)?)\s*([a-z]+)$/.exec(joined);
      const unit = m ? SPAN_UNIT[m[2]!] : undefined;
      if (!m || !unit) return fail('/skip <amount> <days|weeks|months|years>');
      const span: RequestedSpan = { amount: Number(m[1]), unit };
      const days = span.amount * (unit === 'days' ? 1 : unit === 'weeks' ? 7 : unit === 'months' ? 368 / 12 : 368);
      const intent: Intent = { actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: days > 120 ? 'timeSkip' : 'montage', requestedSpan: span };
      const r = resolveTurn(registry, state, intent);
      state = r.state;
      applied.push(...r.draft.applied);
      rejected.push(...r.draft.rejected);
      notices.push(...r.draft.notices);
      report.push(...r.draft.report);
      if (!r.draft.jump) return fail(r.draft.report.join('; ') || 'the skip did not run');
      draft = { jump: r.draft.jump, timeAdvanced: r.draft.timeAdvanced, pacingLevel: r.draft.pacingLevel };
      return out(true, `${r.draft.jump.level} of ${span.amount} ${unit} on the routine`);
    }

    case 'time': {
      const w = args.map((x) => x.toLowerCase());
      let date: CalendarDate | null = null;
      let second: number | null = null;
      const era = w.findIndex((x) => /^(\d+)?(bby|aby)$/.test(x));
      if (era >= 0) {
        const attached = /^(\d+)(bby|aby)$/.exec(w[era]!);
        const yearN = attached ? Number(attached[1]) : Number(w[era - 1]);
        const sign = (attached ? attached[2] : w[era]) === 'bby' ? -1 : 1;
        const rest = w.slice(era + 1);
        const month = rest[0] && /^\d+$/.test(rest[0]) ? Number(rest.shift()) : 1;
        const day = rest[0] && /^\d+$/.test(rest[0]) ? Number(rest.shift()) : 1;
        date = { year: sign * yearN, month, day };
        if (!Number.isInteger(yearN) || !isValidDate(date)) return fail('a date is <year> BBY|ABY [month] [day], e.g. /time 3653 BBY 5 12 08:00');
        if (rest[0]) second = timeFromWords(rest[0]);
        if (rest[0] && second === null) return fail(`unknown time of day "${rest[0]}"`);
      } else {
        second = timeFromWords(w.join(''));
        if (second === null) second = w.length === 1 ? timeFromWords(w[0]!) : null;
        if (second === null) return fail('a time of day (08:00, 8pm, dawn, noon, evening) or a date (3653 BBY 5 12)');
      }
      const now = selectNow(state);
      const nowAbs = now.day * 86_400 + now.second;
      let targetAbs = (date ? absDayFromDate(date) : now.day) * 86_400 + (second ?? now.second);
      if (!date && targetAbs <= nowAbs) targetAbs += 86_400;
      if (targetAbs < nowAbs) return fail('the clock runs forward only (start a new test campaign for an earlier date)');
      if (inFight) return fail('not during a fight');
      const seconds = targetAbs - nowAbs;
      if (seconds > 0) {
        // The one clock writer (advanceTime), with every time hook: rest, healing, rust (architecture §10).
        const adv = advanceTime(registry, state, { seconds, reason: 'dev /time', source: 'turnDraft', requested: seconds });
        state = adv.state;
        applied.push(...adv.applied);
        rejected.push(...adv.rejected);
        notices.push(...adv.notices);
        draft = { timeAdvanced: { seconds: adv.secondsAdvanced, requested: seconds, reason: 'dev /time' } };
      }
      return out(true, `clock forward ${Math.round(seconds / 3600)} h`);
    }

    case 'place': {
      const name = args.join(' ').trim();
      if (!name) return fail('/place <location>');
      const failed = movePlace(name);
      if (failed) return fail(failed);
      return out(true, `moved to ${state.locations.byId[resolveLocationRef(state, name) ?? '']?.name ?? name}`);
    }

    default:
      return out(false, `unknown command /${cmd}. Commands:\n${DEV_HELP.join('\n')}`);
  }
}

/** The dev command as a committed turn: the "[DEV]" line in the transcript, the state in the save (D-180). */
export async function commitDevCommand(
  deps: { registry: Registry<GameState>; storage: Storage; wallClock: () => { iso: string } },
  session: Session,
  text: string,
): Promise<{ session: Session; record: TurnRecord | null; ok: boolean; line: string; simulate503?: number }> {
  const o = runDevCommand(deps.registry, session.state, text);
  // Outside a test campaign nothing is recorded: the save stays as it was (D-180).
  if (!selectIsTestCharacter(session.state)) return { session, record: null, ok: false, line: o.line };
  const prev = session.history[session.history.length - 1];
  // A dev turn is a turn of the save, not of the story: the chapter does not count it (pass 4 issue 13).
  const cur = o.state.memory.current;
  const state: GameState = { ...o.state, meta: { ...o.state.meta, turn: o.state.meta.turn + 1 }, memory: { ...o.state.memory, current: { ...cur, devTurns: (cur.devTurns ?? 0) + 1 } } };
  // Choices offered before a time jump or a new fight no longer fit (D-216; pass 2: capture choices 35 days later).
  const moved = o.draft.jump || o.draft.timeAdvanced || o.draft.combat;
  const keep: Choice[] = prev?.choices && !moved ? [...prev.choices] : [];
  const record: TurnRecord = {
    turn: state.meta.turn,
    input: { kind: 'dev', text: text.trim() },
    draft: {
      intent: null,
      checks: o.draft.checks ?? [],
      training: o.draft.training ?? null,
      timeAdvanced: o.draft.timeAdvanced ?? null,
      jump: o.draft.jump ?? null,
      // A dev command makes no AI call: its combat card is quiet (no narration yet).
      combat: o.draft.combat ? { ...o.draft.combat, quiet: true } : null,
      pacingLevel: o.draft.pacingLevel ?? selectPacingLevel(state),
      notices: o.notices,
      report: o.report,
      resolvedActions: [],
      applied: o.applied,
      rejected: o.rejected,
    },
    narrative: o.line,
    choices: keep,
    moodTags: prev?.moodTags ?? [],
    applied: [],
    rejected: [],
    calls: [],
    clockAfter: { ...selectNow(state) },
  };
  const wall = deps.wallClock();
  const entry: TranscriptEntry<TurnRecord> = { campaignId: state.meta.campaignId, branchId: state.meta.branchId, turn: state.meta.turn, savedAt: wall.iso, data: record };
  const campaign: CampaignRecord = { ...session.campaign, lastPlayedAt: wall.iso };
  await deps.storage.commitTurn(makeEnvelope(deps.registry, state, wall.iso), campaign, entry);
  return { session: { state, history: [...session.history, record], campaign }, record, ok: o.ok, line: o.line, ...(o.simulate503 !== undefined ? { simulate503: o.simulate503 } : {}) };
}
