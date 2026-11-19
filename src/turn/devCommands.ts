// Dev sandbox commands (Jared, D-180): dev mode (?dev=1) and test campaigns only. Typed in the chat box, handled in code
// before the intent call, with no AI call. Each command emits normal engine events through applyEvents (dev-only events
// exist only where no normal event sets the value, and refuse outside a test campaign themselves), so the rules stay
// the same. Each command is a turn record with a short "[DEV]" line, so it shows in the transcript and is in the save.
import type { Choice } from '../ai/schemas/compose';
import type { Intent, RequestedSpan } from '../ai/schemas/intent';
import { CANON_NPCS, type CanonNpc } from '../data/canonNpcs';
import { COMBAT_STAKES } from '../data/progression.config';
import type { SPARRING_MODES } from '../data/combat.config';
import { BODY_PARTS, SEVERITIES, type BodyPart, type Severity } from '../data/health.config';
import { MINION_KINDS } from '../data/npcGen.config';
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
import type { Session } from './pipeline';
import type { TurnRecord } from './record';
import { resolveTurn, type TurnDraft } from './resolve';
export { pendingScenario } from './devScenario';

/** The help text: every command, one line each. Unknown commands show it. */
export const DEV_HELP: readonly string[] = [
  '/fight <count> <kind or level> [at <gap>] [terrain <tags>] [stakes spar|skirmish|serious|lethal] [mode training|controlled|academy]: a fight now, with the duel panel. Kinds: duelist, a minion kind (b1, b2, militia, thug, brawler, trooper, elite, mandalorian, droideka, beast, acolyte), a level, or canon:<name>. Examples: /fight 1 duelist at -10, /fight 6 b1 terrain forest, /fight 1 canon:malgus stakes lethal',
  '/spar <partner level, at <gap>, or canon:<name>> [mode training|controlled|academy]: a sparring session, played out',
  '/wound <location> <severity>: a wound (torso, head, left arm, right leg, left hand ...; minor, moderate, severe, critical, mortal). /heal [all]: wounds and Vitality back (all: lasting injuries too)',
  '/set <skill> <level>, /e <form> <value>, /ci <ability> <value>: stats directly',
  '/fatigue <physical|mental|force> <value>: a fatigue meter as a fraction of capacity (0 fresh, 1 at capacity)',
  '/skip <amount> <days|weeks|months|years>: a montage (or time skip) on the routine',
  '/time <time of day, or year BBY|ABY [month] [day] [time]>: the clock forward to then. /place <location>: move there (created when new)',
  '/scenario <text>: the next narration starts exactly in that situation',
  '/help: this list',
];

const MINION_ALIASES: Readonly<Record<string, string>> = {
  b1: 'battleDroid', battledroid: 'battleDroid', droid: 'battleDroid', droids: 'battleDroid',
  b2: 'superBattleDroid', superbattledroid: 'superBattleDroid',
  elite: 'eliteTrooper', elitetrooper: 'eliteTrooper', commando: 'eliteTrooper',
  mando: 'mandalorian', mandalorians: 'mandalorian',
  acolyte: 'sithAcolyte', sithacolyte: 'sithAcolyte',
  ...Object.fromEntries(MINION_KINDS.flatMap((k) => [[k.id.toLowerCase(), k.id], [`${k.id.toLowerCase()}s`, k.id]])),
};
const MODE_ALIASES: Readonly<Record<string, (typeof SPARRING_MODES)[number]>> = { training: 'trainingSaber', trainingsaber: 'trainingSaber', controlled: 'controlled', academy: 'academy' };
const METER_ALIASES: Readonly<Record<string, 'p' | 'm' | 'f'>> = { p: 'p', physical: 'p', body: 'p', m: 'm', mental: 'm', mind: 'm', f: 'f', force: 'f' };
/** A wound's W by severity: the middle of its band (health §5). */
const SEVERITY_W: Readonly<Record<Severity, number>> = { minor: 5, moderate: 15, severe: 27, critical: 42, mortal: 55 };
const TIMES_OF_DAY: Readonly<Record<string, number>> = { midnight: 0, dawn: 6 * 3600, morning: 8 * 3600, noon: 12 * 3600, midday: 12 * 3600, afternoon: 15 * 3600, evening: 19 * 3600, dusk: 19 * 3600, night: 22 * 3600 };
const SPAN_UNIT: Readonly<Record<string, RequestedSpan['unit']>> = { d: 'days', day: 'days', days: 'days', w: 'weeks', week: 'weeks', weeks: 'weeks', m: 'months', mo: 'months', month: 'months', months: 'months', y: 'years', year: 'years', years: 'years' };
const MAX_DUELISTS = 4;
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

/** The player's reference level for a gap: the main form, else the best form. */
export function playerFormLevel(s: GameState): number {
  const main = selectCharacter(s).mainFormId;
  if (main) return selectLevelExact(s, main);
  return Math.max(0, ...FORM_IDS.map((f) => selectLevelExact(s, f)));
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
}

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

  if (!selectIsTestCharacter(initial)) return fail('dev commands work only in a test campaign (the dev test start, ?dev=1)');
  const words = text.trim().split(/\s+/);
  const cmd = words[0]!.slice(1).toLowerCase();
  const args = words.slice(1);
  const inFight = initial.combat.active !== null;

  switch (cmd) {
    case 'help':
      return out(true, `commands:\n${DEV_HELP.join('\n')}`);

    case 'scenario': {
      const scenario = args.join(' ').trim();
      if (!scenario) return fail('give the situation, e.g. /scenario a forest on Dantooine, ambushed by four Mandalorians');
      return out(true, `scenario for the next narration: ${scenario}`);
    }

    case 'fight':
    case 'spar': {
      if (inFight) return fail('a fight is already in progress (Resolve to end, or Stop sparring, first)');
      const kw = new Set(['at', 'terrain', 'stakes', 'mode']);
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
        } else if (k === 'mode') {
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
      const minionGroups: { kind: string; count: number }[] = [];
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
        apply([{ type: 'npcIntroduced', name: c.name, species: c.speciesId, faction: c.faction, role: c.role, ageApprox: Math.round(age), description: 'a dev sandbox opponent (canon)' }], 'dev');
        const id = Object.values(state.npcs.byId).find((n) => n.name === c.name)?.id;
        if (!id) return fail(refused() ?? 'could not introduce the canon figure');
        apply([{ type: 'npcCanonLinked', npcRef: id, canonId: c.canonId }], 'engine');
        opponentRefs.push(id);
        who = c.name;
      } else if (minion) {
        if (gap !== null) report.push('at is ignored for minions: their levels come from their kind and grade');
        minionGroups.push({ kind: minion, count });
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
          apply([{ type: 'npcIntroduced', name, species: 'human', faction: ally ? 'jediOrder' : 'sithEmpire', role: ally ? 'jediKnight' : 'sithLord', ageApprox: 35, description: 'a dev sandbox opponent' }], 'dev');
          const id = Object.values(state.npcs.byId).find((x) => x.name === name)?.id;
          if (!id) return fail(refused() ?? 'could not introduce the duelist');
          apply([{ type: 'devNpcLevelsSet', npcRef: id, level }], 'dev');
          if (refused()) return fail(refused()!);
          opponentRefs.push(id);
        }
        who = `${count} ${base.toLowerCase()}${count > 1 ? 's' : ''} at ${level.toFixed(1)} (your form ${playerFormLevel(state).toFixed(1)})`;
      } else return fail(`unknown kind "${kind}" (duelist, a level, a minion kind, or canon:<name>)`);
      const before = state;
      apply([{ type: 'fightBegun', fromPending: false, opponentRefs, minionGroups, stakes, terrainTags: tags, ...(mode ? { sparringMode: mode } : {}), ...(stakes === 'spar' ? { playOut: true } : {}) }], 'engine');
      if (!state.combat.active) return fail(refused() ?? 'the fight did not begin');
      draft = { combat: combatDraft(before, state, true, report), pacingLevel: selectPacingLevel(state) };
      kind = state.combat.active.sparring ? `${stakes} (${state.combat.active.sparring})` : stakes;
      return out(true, `${cmd === 'spar' ? 'sparring session' : 'fight'} begun: ${who}, ${kind}${tags.length ? `, terrain ${tags.join(', ')}` : ''}`);
    }

    case 'wound': {
      if (inFight) return fail('not during a fight (the duel owns the wounds)');
      const sev = args[args.length - 1]?.toLowerCase() as Severity | undefined;
      if (!sev || !SEVERITIES.includes(sev)) return fail(`the severity comes last: ${SEVERITIES.join(', ')}`);
      const part = partFromWords(args.slice(0, -1).join(' '));
      if (!part) return fail(`unknown location (${BODY_PARTS.join(', ')})`);
      apply([{ type: 'healthSynced', vitalityLost: state.health.vitalityLost, addWounds: [{ id: 'dev', part, severity: sev, W: SEVERITY_W[sev], stabilized: false, healProgress: 0, day: selectNow(state).day, source: 'dev command' }], cause: 'dev command' }], 'engine');
      if (refused()) return fail(refused()!);
      return out(true, `${sev} wound to the ${part}`);
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
      apply([{ type: 'devFatigueSet', meter, fraction: Math.max(0, Math.min(3, v)) }], 'dev');
      if (refused()) return fail(refused()!);
      return out(true, `${meter === 'p' ? 'physical' : meter === 'm' ? 'mental' : 'Force'} fatigue at ${Math.max(0, Math.min(3, v))}`);
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
      let id = resolveLocationRef(state, name);
      if (!id) {
        apply([{ type: 'locationCreatedByPlayer', name }], 'player');
        id = resolveLocationRef(state, name);
        if (!id) return fail(refused() ?? 'could not create the place');
      }
      apply([{ type: 'locationChanged', locationRef: id }], 'dev');
      if (refused()) return fail(refused()!);
      return out(true, `moved to ${state.locations.byId[id]?.name ?? name}`);
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
): Promise<{ session: Session; record: TurnRecord | null; ok: boolean; line: string }> {
  const o = runDevCommand(deps.registry, session.state, text);
  // Outside a test campaign nothing is recorded: the save stays as it was (D-180).
  if (!selectIsTestCharacter(session.state)) return { session, record: null, ok: false, line: o.line };
  const prev = session.history[session.history.length - 1];
  const state: GameState = { ...o.state, meta: { ...o.state.meta, turn: o.state.meta.turn + 1 } };
  const keep: Choice[] = prev?.choices ? [...prev.choices] : [];
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
  return { session: { state, history: [...session.history, record], campaign }, record, ok: o.ok, line: o.line };
}
