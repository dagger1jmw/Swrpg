// Building a battle from what is checked (m8-ship-battles, D-517; spec/ship-battles.md section 2). The narrator proposes in plain
// words ("two Terminus destroyers and a wing of fighters"); the code reads them against the dated ship classes, the people
// present and the situation, and builds the sides. A standing force (an occupation's armada) and a blockade's pickets come from
// data, whatever the words say. Pure; reads the state through selectors.
import { selectWoundPenalty } from '../health/selectors';
import { BATTLE_LIMITS, BLOCKADE_PICKETS, CLASS_SIDES, CLASS_WORDS, DEFAULT_PICKETS, FIRST_OFFICER_GAP, GENERIC_CREW, NPC_FORMATION, STANDING_FORCES, type BattleRole, type BattleTrigger, type StandingForce } from '../../data/shipBattles.config';
import { BLOCKADES, type BlockadeDef } from '../../data/blockades';
import { minionKindInEra, MINION_ERA_FALLBACK } from '../../data/npcGen.config';
import { SERVICE_LADDER_BY_ID } from '../../data/serviceRanks';
import { blockadeStateAt } from '../../engine/blockade';
import { dateFromAbsDay } from '../../engine/calendar';
import { crewOf, newShip, SHIP_CLASSES, shipInService, type Crew, type ShipClass, type ShipState } from '../../engine/ships';
import { seedRng } from '../../engine/rng';
import { wingsOf } from '../../engine/fleetBattle';
import type { GameState } from '../../state/gameState';
import { selectCharacter } from '../character/selectors';
import { selectNpcShipCrew, selectShipCrew } from '../combat/selectors';
import { selectDroids } from '../droids/selectors';
import { ratedSkills } from '../../engine/droids';
import { selectHasFlag } from '../flags/selectors';
import { selectCurrentLocation } from '../locations/selectors';
import { selectNpc, selectNpcLevel } from '../npcs/selectors';
import { selectPresentNpcIds } from '../pacing/selectors';
import { selectLevelExact, selectPerformance } from '../progression/selectors';
import { selectNpcTraitIds } from '../traits/selectors';
import { selectNetworkState } from '../world/selectors';
import type { BattleSetup, Commander, SideInfo } from './rules';
import type { ShipCondition } from './battles';
import { shipEffects } from '../../engine/shipLife';
import { MOD_BATTLE } from '../../data/shipLife.config';
import { hereWorld } from '../ships';
import { selectShipAt } from '../ships/selectors';
import type { OwnedShip } from '../ships/selectors';

/**
 * The character's own ship for a battle (m8-ship-life): one of the ships slice's, usable here (docked at this world or with no
 * dock on record), of the class the words name, else the active one. Its id carries the condition the battles slice keeps.
 */
export function ownedForBattle(s: GameState, classId: string | null): OwnedShip | null {
  const sl = (s as { ships?: { ships: Record<string, OwnedShip> } }).ships;
  if (!sl) return null;
  const world = hereWorld(s);
  const here = Object.values(sl.ships).filter((x) => !x.impounded && (x.dockedAt === null || world === null || x.dockedAt.toLowerCase() === world.toLowerCase()));
  if (classId) return here.find((x) => x.classId === classId) ?? null;
  // The active ship if it is here (a fighter without a hyperdrive too), else one that can travel from here.
  return here.find((x) => x.id === (s as { ships?: { activeId: string | null } }).ships?.activeId) ?? selectShipAt(s, world) ?? here[0] ?? null;
}

/** A ship state for the character's own ship: the owned record's id and name, its mods (shields, hull), then its damage. */
export function ownShipState(fallbackId: string, classId: string, crew: Crew, fallbackName: string, owned: OwnedShip | null, cond: ShipCondition | undefined): ShipState {
  let ship = newShip(owned?.id ?? fallbackId, classId, crew, owned?.name ?? fallbackName);
  if (owned) {
    const fx = shipEffects(classId, owned.mods);
    ship = { ...ship, hull: Math.round(ship.hull * fx.hullX), shields: Object.fromEntries(Object.entries(ship.shields).map(([k, v]) => [k, (v ?? 0) * fx.shieldX])) };
    // Mods in battle (m8-ground Part B2, D-521): weapon mods add barrels and weight, a jammer helps against locks, sensors read them.
    const w = Math.min(2, fx.weapons);
    if (w > 0 || fx.jammer > 0 || fx.scan > 0) ship = { ...ship, kit: { barrels: MOD_BATTLE.barrels[w] ?? 0, heavy: MOD_BATTLE.heavy[w] ?? 1, jammer: fx.jammer, sensors: fx.scan } };
  }
  return withCondition(ship, cond);
}

/** The engine mods' edge on a pilot's rolls (handling; m8-ship-life). */
const modEdge = (owned: OwnedShip | null): { source: string; value: number }[] => {
  const h = owned ? shipEffects(owned.classId, owned.mods).handling : 0;
  return h ? [{ source: 'ship modifications', value: h }] : [];
};

export const yearOf = (s: GameState): number => dateFromAbsDay(s.clock.now.day).year;

const PATH_FACTION: Readonly<Record<string, string>> = { jedi: 'jediOrder', sith: 'sith', outsider: 'civilian', career: 'republic' };
/** The player's side as the world reads it. */
export const playerFaction = (s: GameState): string => selectCharacter(s).start?.faction ?? PATH_FACTION[selectCharacter(s).path] ?? 'republic';

const NUMBER_WORDS: Readonly<Record<string, number>> = { a: 1, an: 1, one: 1, single: 1, lone: 1, two: 2, pair: 2, couple: 2, three: 3, few: 3, several: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, dozen: 12, squadron: 12, flight: 4, wing: 24, handful: 4 };

/** A class's short name for matching ("Terminus", "Harrower", "X-wing", "Mark VI Supremacy"). */
function shortNames(c: ShipClass): string[] {
  const n = c.name.toLowerCase();
  const out = new Set<string>([n, c.id.toLowerCase()]);
  const m = n.match(/^(?:the\s+)?([a-z0-9' -]+?)-class/);
  if (m) out.add(m[1]!.trim());
  const t = n.match(/^(?:[a-z0-9/-]+\s+)?([a-z0-9-]+(?:\s[a-z0-9-]+)?)$/);
  if (t) out.add(t[1]!);
  for (const w of n.replace(/-class.*/, '').split(/\s+/)) if (w.length >= 5 && !['class', 'starfighter', 'cruiser', 'frigate', 'destroyer', 'corvette', 'freighter', 'bomber', 'tactical'].includes(w)) out.add(w);
  return [...out];
}

export interface ParsedShips {
  ships: { classId: string; count: number }[];
  errors: string[];
}

/** The classes in service for a side of a kind (for a plain word: "a Sith frigate"). */
export const classesFor = (faction: string, year: number, kinds: readonly string[]): ShipClass[] =>
  SHIP_CLASSES.filter((c) => shipInService(c, year) && kinds.includes(c.role === 'bomber' ? 'bomber' : c.kind) && (CLASS_SIDES[c.id] ?? []).includes(faction));

/** The narrator's plain words, read against the dated classes of the year. Unknown or out-of-date classes are refused. */
export function parseShips(text: string, faction: string, year: number): ParsedShips {
  const ships: ParsedShips['ships'] = [];
  const errors: string[] = [];
  const chunks = text.toLowerCase().split(/,|;|\band\b|\bplus\b|\bwith\b|\+/).map((x) => x.trim()).filter(Boolean);
  for (const chunk of chunks) {
    const num = chunk.match(/\b(\d{1,3})\b/);
    const word = chunk.split(/\s+/).find((w) => NUMBER_WORDS[w.replace(/s$/, '')] !== undefined || NUMBER_WORDS[w] !== undefined);
    let count = num ? Number(num[1]) : word ? (NUMBER_WORDS[word] ?? NUMBER_WORDS[word.replace(/s$/, '')] ?? 1) : 1;
    const of = chunk.match(/\b(squadron|wing|flight|dozen)s?\s+of\b/);
    if (of) count = NUMBER_WORDS[of[1]!] ?? count;
    const named = SHIP_CLASSES.map((c) => ({ c, hit: shortNames(c).filter((n) => chunk.includes(n)).sort((a, b) => b.length - a.length)[0] })).filter((x) => x.hit).sort((a, b) => b.hit!.length - a.hit!.length);
    // A named class: it must be in service this year.
    if (named.length) {
      const inYear = named.find((x) => shipInService(x.c, year));
      if (!inYear) {
        errors.push(`${named[0]!.c.name} is not in service in ${year < 0 ? `${-year} BBY` : `${year} ABY`}`);
        continue;
      }
      ships.push({ classId: inYear.c.id, count: Math.max(1, count) });
      continue;
    }
    // A plain word: the side's class of that kind in service.
    const kind = Object.entries(CLASS_WORDS).find(([, words]) => words.some((w) => chunk.includes(w)))?.[0];
    if (!kind) {
      if (/\b(ship|ships|vessel|craft)\b/.test(chunk)) errors.push(`"${chunk}" names no class or kind of ship`);
      continue;
    }
    const kinds = kind === 'frigate' ? ['frigate', 'corvette'] : kind === 'starDestroyer' ? ['starDestroyer', 'battlecruiser', 'heavyCruiser'] : [kind];
    const c = classesFor(faction, year, kinds)[0] ?? SHIP_CLASSES.find((x) => shipInService(x, year) && kinds.includes(x.role === 'bomber' ? 'bomber' : x.kind));
    if (!c) {
      errors.push(`no ${kind} class is on record for ${faction} in ${year < 0 ? `${-year} BBY` : `${year} ABY`}`);
      continue;
    }
    ships.push({ classId: c.id, count: Math.max(1, count) });
  }
  return { ships, errors };
}

/** The troops a side sends across to board, by faction and year (a minion kind). */
export function troopsFor(faction: string, year: number): string {
  const want = faction === 'sithEmpire' || faction === 'sith' ? (year <= -3627 ? 'sithTrooper' : year >= -19 ? 'stormtrooper' : 'trooper') : faction === 'republic' || faction === 'jediOrder' ? (year >= -22 && year < -18 ? 'cloneTrooper' : 'trooper') : faction === 'mandalorians' ? 'mandalorian' : faction === 'independent' ? (year >= -32 && year < -18 ? 'battleDroid' : 'trooper') : 'thug';
  return minionKindInEra(want, year) ? want : (MINION_ERA_FALLBACK[want] ?? 'trooper');
}

/** A crew level by side kind (no named figure aboard). */
export const genericCrew = (kind: string): number => GENERIC_CREW[kind] ?? GENERIC_CREW['navy']!;

/** The ships of a side, built (capital ships carry their own wings). */
export function buildShips(prefix: string, list: readonly { classId: string; count: number }[], crew: number | Crew, label: (c: ShipClass, i: number) => string): ShipState[] {
  const out: ShipState[] = [];
  for (const { classId, count } of list) {
    const c = SHIP_CLASSES.find((x) => x.id === classId)!;
    for (let i = 0; i < count; i++) out.push(newShip(`${prefix}${out.length}`, classId, crew, label(c, i)));
  }
  return out;
}

const shortName = (c: ShipClass): string => c.name.replace(/-class.*$/, '').replace(/^the\s+/i, '').replace(/ type$/, '');

/** A commander from a named NPC (their Tactics and traits) or a generic officer of the side. */
export function commanderOf(s: GameState, npcId: string | null, fallback: string, kind: string): Commander {
  const n = npcId ? selectNpc(s, npcId) : null;
  if (n) return { name: n.name, npcId: n.id, tactics: Math.max(genericCrew(kind), selectNpcLevel(s, n.id, 'tactics')), traits: selectNpcTraitIds(s, n.id), jedi: n.factionId === 'jediOrder' };
  return { name: fallback, npcId: null, tactics: genericCrew(kind), traits: [], jedi: false };
}

/** Command by rank (Jared): a naval captain or better, or the fleetCommand flag; else only when the story hands it over. */
export function playerMayCommand(s: GameState): boolean {
  const svc = s.ranks.service;
  if (selectHasFlag(s, 'fleetCommand')) return true;
  if (!svc) return false;
  const ladder = SERVICE_LADDER_BY_ID.get(svc.ladderId);
  return ladder?.branch === 'navy' ? svc.rung >= 2 : ladder?.branch === 'army' ? svc.rung >= 4 : false;
}

/** The crew around the player in a fighter or freighter: their levels, the people present as gunners, an engineer, repairs. */
export function playerFlyer(s: GameState, cls: ShipClass): { crew: Crew; flyer: Partial<{ wingman: boolean; forceOrDroid: boolean; engineer: boolean; gunners: number[]; repairBy: 'player' | 'droid' | 'crew' | null }> } {
  const me = selectShipCrew(s);
  const present = selectPresentNpcIds(s).filter((id) => selectNpc(s, id));
  const turrets = cls.weapons.filter((m) => m.turret).reduce((t, m) => t + Math.max(1, Object.values(m.arcs).reduce((a, b) => a + b, 0)), 0);
  const gunners = present.map((id) => selectNpcShipCrew(s, id).gunnery).sort((a, b) => b - a).slice(0, cls.kind === 'freighter' ? turrets : 0);
  const crewRepair = Math.max(0, ...present.map((id) => selectNpcLevel(s, id, 'repair')));
  const droidRepair = Math.max(0, ...selectDroids(s).map((u) => ratedSkills(u, s.clock.now.day).repair ?? 0));
  const best = Math.max(me.repair, crewRepair, droidRepair);
  const repairBy: 'player' | 'droid' | 'crew' | null = best <= 0 ? null : best === me.repair ? 'player' : best === droidRepair ? 'droid' : 'crew';
  return {
    crew: { ...me, repair: best },
    flyer: { gunners, engineer: cls.kind === 'freighter' && present.some((id) => selectNpcLevel(s, id, 'repair') >= 20), repairBy, forceOrDroid: selectLevelExact(s, 'forceSense') >= 40 || selectPerformance(s, 'piloting') <= 0 },
  };
}

/** A ship the player has flown: its class with the damage the last battle left (Jared's brief F: damage carries over). */
export function withCondition(ship: ShipState, cond: ShipCondition | undefined): ShipState {
  if (!cond || cond.classId !== ship.classId) return ship;
  return { ...ship, id: cond.id, name: cond.name, hull: cond.hull, systems: { ...cond.systems }, burnt: { ...cond.burnt }, ammo: Object.fromEntries(Object.entries(cond.ammo).map(([k, v]) => [Number(k), v])) };
}

/** The standing force holding this place now (an occupation's armada), when its event is under way. */
export function standingForceHere(s: GameState): StandingForce | null {
  const loc = selectCurrentLocation(s);
  if (!loc) return null;
  const names = [loc.name, ...loc.aliases].map((x) => x.toLowerCase());
  const net = selectNetworkState(s);
  return STANDING_FORCES.find((f) => names.some((n) => n.includes(f.place.toLowerCase())) && net.events[f.event]?.status === 'underway') ?? null;
}

/** A side's info from what is known. */
export function sideOf(name: string, faction: string, kind: string, commander: Commander): Omit<SideInfo, 'commanderGone'> {
  return { name, faction, kind, commander, firstOfficer: { name: 'the first officer', tactics: Math.max(genericCrew(kind), commander.tactics - FIRST_OFFICER_GAP) } };
}

export interface Proposal {
  scale: 'dogfight' | 'fleet';
  trigger: BattleTrigger;
  enemyFaction: string;
  enemy: string;
  allies?: string;
  playerShip?: string;
  role?: BattleRole;
  commandHanded?: string;
  commanderRef?: string;
}

/** The side the player's own usually fights (a default when the words name none). */
export const opposite = (faction: string): string => (faction === 'sithEmpire' || faction === 'sith' ? 'republic' : 'sithEmpire');

/** Words that name a side, longest first (the narrator's plain words). */
const FACTION_WORDS: readonly (readonly [string, string])[] = [
  ['sith empire', 'sithEmpire'],
  ['new republic', 'republic'],
  ['imperial', 'sithEmpire'],
  ['empire', 'sithEmpire'],
  ['republic', 'republic'],
  ['alliance', 'republic'],
  ['rebel', 'republic'],
  ['mandalorian', 'mandalorians'],
  ['separatist', 'independent'],
  ['confederacy', 'independent'],
  ['pirate', 'underworld'],
  ['raider', 'underworld'],
  ['smuggler', 'underworld'],
  ['hutt', 'underworld'],
  ['jedi', 'jediOrder'],
  ['sith', 'sith'],
];
const BATTLE_ROLE_WORDS = ['pilot', 'gunner', 'commander', 'crew'] as const;

/**
 * The narrator's one field (combatStarted's `ships`): "enemy: two Imperial Terminus destroyers and a squadron of fighters;
 * allies: three Thranta corvettes; mine: Aurek; role: gunner; command: the admiral is dead; ambush". The scale follows from the
 * ships (a capital ship on either side makes it a fleet battle) unless "fleet" or "dogfight" is said.
 */
export function parseProposal(what: string, mine: string, year: number): Proposal {
  const text = what.toLowerCase();
  const part = (keys: readonly string[]): string | undefined => {
    for (const seg of what.split(';')) {
      const m = seg.match(/^\s*([a-z ]+?)\s*:\s*(.*)$/i);
      if (m && keys.includes(m[1]!.toLowerCase().trim())) return m[2]!.trim();
    }
    return undefined;
  };
  const enemy = part(['enemy', 'enemies', 'foe', 'foes']) ?? what.split(';')[0]!.replace(/^[^:]*:/, '').trim();
  const allies = part(['allies', 'ally', 'friends', 'our fleet']);
  const ship = part(['mine', 'my ship', 'ship', 'flying']);
  const role = part(['role'])?.toLowerCase();
  const command = part(['command', 'command handed']);
  const side = FACTION_WORDS.find(([w]) => enemy.toLowerCase().includes(w))?.[1] ?? opposite(mine);
  const trigger: BattleTrigger = /\bambush/.test(text) ? 'ambush' : /\bblockade/.test(text) ? 'blockade' : /\b(pursu|chase)/.test(text) ? 'pursuit' : /\bdefen/.test(text) ? 'defence' : /\battack/.test(text) ? 'attack' : 'sighted';
  const capital = (words: string | undefined, f: string): boolean => !!words && parseShips(words, f, year).ships.some((x) => !['fighter', 'freighter'].includes(SHIP_CLASSES.find((c) => c.id === x.classId)!.kind));
  const scale = /\bdogfight/.test(text) ? 'dogfight' : /\bfleet\b/.test(text) || capital(enemy, side) || capital(allies, mine) ? 'fleet' : 'dogfight';
  return {
    scale,
    trigger,
    enemyFaction: side,
    enemy,
    ...(allies ? { allies } : {}),
    ...(ship ? { playerShip: ship } : {}),
    ...(role && (BATTLE_ROLE_WORDS as readonly string[]).includes(role) ? { role: role as BattleRole } : {}),
    ...(command ? { commandHanded: command } : {}),
  };
}

const KIND_OF_FACTION: Readonly<Record<string, string>> = { underworld: 'pirate', civilian: 'militia', independent: 'navy', mandalorians: 'elite' };

/** A proposal checked and built, or the reasons it is refused. */
export function setupFromProposal(s: GameState, p: Proposal, id: string): { setup: BattleSetup } | { reject: string } {
  const year = yearOf(s);
  const mine = playerFaction(s);
  const loc = selectCurrentLocation(s);
  const force = standingForceHere(s);
  const againstForce = force && (force.faction === p.enemyFaction || (force.faction === 'sithEmpire' && p.enemyFaction === 'sith'));
  const enemyFaction = againstForce ? force!.faction : p.enemyFaction;
  const enemyKind = againstForce ? force!.kind : (KIND_OF_FACTION[enemyFaction] ?? 'navy');
  const parsed = againstForce ? { ships: force!.ships.map((x) => ({ ...x })), errors: [] } : parseShips(p.enemy, enemyFaction, year);
  if (parsed.errors.length) return { reject: parsed.errors.join('; ') };
  if (!parsed.ships.length) return { reject: `no ship of the enemy could be read from "${p.enemy}"` };
  const cls = (id: string): ShipClass => SHIP_CLASSES.find((c) => c.id === id)!;
  const isSmall = (id: string): boolean => cls(id).kind === 'fighter' || cls(id).kind === 'freighter';
  const enemyCrew = genericCrew(enemyKind);
  const cap = (n: number): number => Math.min(BATTLE_LIMITS.capitalPerSide, n);
  // The player's own ship: named in the proposal, else the last one flown, read with its damage.
  const ownWords = p.playerShip ? parseShips(p.playerShip, mine, year) : null;
  if (ownWords?.errors.length) return { reject: ownWords.errors.join('; ') };
  const owned = ownedForBattle(s, ownWords?.ships[0]?.classId ?? null);
  const lastCond = owned ? s.battles.ships[owned.id] : s.battles.lastShipId ? s.battles.ships[s.battles.lastShipId] : undefined;
  const ownClassId = owned?.classId ?? ownWords?.ships[0]?.classId ?? (lastCond && shipInService(cls(lastCond.classId), year) ? lastCond.classId : null);
  const commanderNpc = p.commanderRef && selectNpc(s, p.commanderRef) ? p.commanderRef : null;
  const enemyCmd = commanderOf(s, againstForce ? (Object.values(s.npcs.byId).find((n) => n.canonId === force!.commanderCanonId)?.id ?? null) : commanderNpc, againstForce ? force!.commander : 'the enemy commander', enemyKind);
  const enemy = sideOf(againstForce ? force!.name : `the ${enemyFaction === 'sithEmpire' ? 'Imperial' : enemyFaction} ships`, enemyFaction, enemyKind, enemyCmd);
  const rng = seedRng(`${s.meta.campaignId}:${id}:${s.meta.turn}`);
  const place = { placeId: loc?.id ?? null, placeName: loc?.name ?? 'open space' };
  const stakes = 'lethal' as const;
  if (p.scale === 'dogfight') {
    if (!ownClassId) return { reject: 'a dogfight needs the player\'s own fighter or freighter (name it in playerShip)' };
    if (!isSmall(ownClassId)) return { reject: `${cls(ownClassId).name} is not a fighter or freighter` };
    const foes = parsed.ships.filter((x) => isSmall(x.classId));
    if (!foes.length) return { reject: 'a dogfight is fought against fighters or freighters; capital ships make it a fleet battle' };
    const pf = playerFlyer(s, cls(ownClassId));
    const ownShip = ownShipState(`${id}:own`, ownClassId, pf.crew, shortName(cls(ownClassId)), owned, lastCond);
    const enemyShips = buildShips(`${id}:e`, foes.map((x) => ({ ...x, count: Math.min(24, x.count) })), enemyCrew, (c, i) => `${shortName(c)} ${i + 1}`);
    const allies = p.allies ? parseShips(p.allies, mine, year).ships : [];
    const flyer = { ...pf.flyer, wingman: allies.some((x) => cls(x.classId).kind === 'fighter'), mods: modEdge(owned) };
    const role: BattleRole = p.role === 'gunner' && cls(ownClassId).kind === 'freighter' ? 'gunner' : 'pilot';
    const player = sideOf(selectCharacter(s).name, mine, 'navy', commanderOf(s, null, selectCharacter(s).name, 'navy'));
    return { setup: { id, kind: 'dogfight', role, trigger: p.trigger, stakes, ...place, year, player, enemy, playerShips: [ownShip], enemyShips, ownShipId: ownShip.id, flyer, rng, playerCommands: false } };
  }
  // A fleet battle: the allies' capital ships, the player aboard one, flying, or commanding.
  const allyParsed = p.allies ? parseShips(p.allies, mine, year) : { ships: [], errors: [] };
  if (allyParsed.errors.length) return { reject: allyParsed.errors.join('; ') };
  const allyCapitals = allyParsed.ships.filter((x) => !isSmall(x.classId));
  const ownIsFighter = ownClassId !== null && cls(ownClassId).kind === 'fighter';
  if (!allyCapitals.length && !(ownClassId && !isSmall(ownClassId))) return { reject: 'a fleet battle needs capital ships on the player\'s side (name them in allies)' };
  const enemyCapitals = parsed.ships.filter((x) => !isSmall(x.classId));
  if (!enemyCapitals.length) return { reject: 'a fleet battle needs enemy capital ships; fighters alone make it a dogfight' };
  const wantsCommand = p.role === 'commander' || p.commandHanded !== undefined;
  const commands = wantsCommand && (playerMayCommand(s) || (p.commandHanded ?? '').trim().length > 0);
  if (p.role === 'commander' && !commands) return { reject: 'command goes by rank: the player holds no rank that commands a fleet, and the story did not hand it over (commandHanded)' };
  const role: BattleRole = commands ? 'commander' : ownIsFighter || p.role === 'pilot' ? 'pilot' : 'crew';
  const allyCrew = genericCrew('navy');
  const allyList = allyCapitals.map((x) => ({ ...x, count: cap(x.count) }));
  if (ownClassId && !isSmall(ownClassId) && !allyList.some((x) => x.classId === ownClassId)) allyList.unshift({ classId: ownClassId, count: 1 });
  const playerShips = buildShips(`${id}:a`, allyList, allyCrew, (c, i) => `${shortName(c)} ${i + 1}`);
  const enemyShips = buildShips(`${id}:b`, enemyCapitals.map((x) => ({ ...x, count: cap(x.count) })), enemyCrew, (c, i) => `${shortName(c)} ${i + 1}`);
  // The commander's own Tactics when the player commands; the player's own fighter when they fly.
  const me = selectCharacter(s).name;
  // The wound's penalty on the player's command (D-527; opt-2), read when the battle is set up.
  const playerCmd = commands ? { name: me, npcId: null, tactics: selectPerformance(s, 'tactics') * (1 - selectWoundPenalty(s, 'tactics')), traits: [], jedi: selectCharacter(s).path === 'jedi' } : commanderOf(s, null, 'the fleet commander', 'navy');
  const player = sideOf(commands ? `${me}'s fleet` : `the ${mine === 'jediOrder' ? 'Republic' : mine} fleet`, mine, 'navy', playerCmd);
  let ownShipId = playerShips[0]!.id;
  if (role === 'commander' || role === 'crew') playerShips[0] = owned && owned.classId === playerShips[0]!.classId ? ownShipState(playerShips[0]!.id, owned.classId, playerShips[0]!.crew, playerShips[0]!.name, owned, lastCond) : withCondition(playerShips[0]!, lastCond);
  if (role === 'pilot' && ownClassId && ownIsFighter) {
    const pf = playerFlyer(s, cls(ownClassId));
    const fighter = withCondition(newShip(`${id}:own`, ownClassId, pf.crew, shortName(cls(ownClassId))), lastCond);
    playerShips.push(fighter);
    ownShipId = fighter.id;
  }
  const playerWings = playerShips.filter((x) => x.id !== ownShipId || role !== 'pilot').flatMap((x) => wingsOf(x, allyCrew));
  const enemyWings = [...enemyShips.flatMap((x) => wingsOf(x, enemyCrew)), ...(againstForce ? force!.wings.map((w, i) => ({ id: `${id}:fw${i}`, classId: w.classId, count: w.count, level: enemyCrew, state: 'aboard' as const, mission: 'screen' as const, warheads: 0, from: enemyShips[0]?.id ?? null })) : [])];
  return {
    setup: {
      id,
      kind: 'fleet',
      role,
      trigger: p.trigger,
      stakes,
      ...place,
      year,
      player,
      enemy,
      playerShips: role === 'pilot' ? playerShips : playerShips,
      enemyShips,
      ownShipId,
      playerWings,
      enemyWings,
      enemyFormation: againstForce ? force!.formation : (NPC_FORMATION[enemyKind] ?? 'exchange'),
      rng,
      playerCommands: role === 'commander',
      ...(againstForce ? { forceId: force!.id } : {}),
    },
  };
}

/** The pickets a blockade sends at a ship forcing its way through (the force-through approach as a ship battle). */
export function setupFromBlockade(s: GameState, b: BlockadeDef, to: string, direction: 'in' | 'out' | 'through', fleet: boolean, id: string): { setup: BattleSetup } | { reject: string } {
  const year = yearOf(s);
  const st = blockadeStateAt(b, s.clock.now.day);
  const picket = BLOCKADE_PICKETS[b.id];
  const faction = picket?.faction ?? b.side;
  const kind = picket?.kind ?? 'navy';
  // A picket class out of service this year falls back to the side's own of the date (D-438: one dated list).
  const live = (id: string | undefined): string | undefined => (id && shipInService(SHIP_CLASSES.find((c) => c.id === id)!, year) ? id : undefined);
  const fighter = live(picket?.fighter) ?? classesFor(faction, year, ['fighter'])[0]?.id ?? classesFor('sithEmpire', year, ['fighter'])[0]?.id;
  const capital = live(picket?.capital) ?? classesFor(faction, year, ['frigate', 'corvette', 'heavyCruiser'])[0]?.id ?? classesFor('sithEmpire', year, ['frigate', 'corvette', 'heavyCruiser'])[0]?.id;
  const crew = genericCrew(kind);
  const strength = st.strength;
  const fightersN = Math.max(1, Math.round(strength * (picket?.fightersPer ?? DEFAULT_PICKETS.fightersPer)));
  const capitalN = Math.max(1, Math.round(strength * (picket?.capitalPer ?? DEFAULT_PICKETS.capitalPer)));
  const mine = playerFaction(s);
  const enemy = sideOf(b.name, faction, kind, commanderOf(s, null, 'the picket commander', kind));
  const player = sideOf(selectCharacter(s).name, mine, 'navy', commanderOf(s, null, selectCharacter(s).name, 'navy'));
  const rng = seedRng(`${s.meta.campaignId}:${id}:${s.meta.turn}`);
  const loc = selectCurrentLocation(s);
  const place = { placeId: loc?.id ?? null, placeName: b.name };
  const ownedB = ownedForBattle(s, null);
  const ownedSmall = ownedB && ['fighter', 'freighter'].includes(SHIP_CLASSES.find((c) => c.id === ownedB.classId)?.kind ?? '') ? ownedB : null;
  const lastCond = ownedSmall ? s.battles.ships[ownedSmall.id] : s.battles.lastShipId ? s.battles.ships[s.battles.lastShipId] : undefined;
  const cls = (cid: string): ShipClass => SHIP_CLASSES.find((c) => c.id === cid)!;
  if (!fleet) {
    // An ace alone: the pickets' fighters, one after another; breaking off is getting through.
    const ownId = ownedSmall ? ownedSmall.classId : lastCond && shipInService(cls(lastCond.classId), year) && ['fighter', 'freighter'].includes(cls(lastCond.classId).kind) ? lastCond.classId : (classesFor(mine, year, ['freighter'])[0]?.id ?? SHIP_CLASSES.find((c) => shipInService(c, year) && c.kind === 'freighter')?.id ?? classesFor(mine, year, ['fighter'])[0]?.id);
    if (!ownId || !fighter) return { reject: 'no ship class is on record for this date to run the line in' };
    const pf = playerFlyer(s, cls(ownId));
    const own = ownShipState(`${id}:own`, ownId, pf.crew, shortName(cls(ownId)), ownedSmall, lastCond);
    const enemyShips = buildShips(`${id}:e`, [{ classId: fighter, count: Math.min(12, fightersN) }], crew, (c, i) => `${shortName(c)} ${i + 1}`);
    return { setup: { id, kind: 'dogfight', role: 'pilot', trigger: 'blockade', stakes: 'lethal', ...place, year, player, enemy, playerShips: [own], enemyShips, ownShipId: own.id, flyer: { ...pf.flyer, mods: modEdge(ownedSmall) }, rng, playerCommands: false, blockade: { id: b.id, to, direction } } };
  }
  if (!capital) return { reject: 'no capital ship class is on record for the pickets in this year' };
  const allies = classesFor(mine, year, ['frigate', 'corvette', 'heavyCruiser']);
  if (!allies.length) return { reject: 'no capital ship class is on record for the player\'s side in this year' };
  const playerShips = buildShips(`${id}:a`, [{ classId: allies[0]!.id, count: capitalN + 1 }], genericCrew('navy'), (c, i) => `${shortName(c)} ${i + 1}`);
  const enemyShips = buildShips(`${id}:b`, [{ classId: capital, count: capitalN }], crew, (c, i) => `${shortName(c)} ${i + 1}`);
  const cmd = playerMayCommand(s);
  const playerCmd = cmd ? { name: selectCharacter(s).name, npcId: null, tactics: selectPerformance(s, 'tactics'), traits: [], jedi: selectCharacter(s).path === 'jedi' } : commanderOf(s, null, 'the fleet commander', 'navy');
  return {
    setup: {
      id,
      kind: 'fleet',
      role: cmd ? 'commander' : 'crew',
      trigger: 'blockade',
      stakes: 'lethal',
      ...place,
      year,
      player: sideOf(cmd ? `${selectCharacter(s).name}'s fleet` : 'the relief fleet', mine, 'navy', playerCmd),
      enemy,
      playerShips,
      enemyShips,
      ownShipId: playerShips[0]!.id,
      playerWings: playerShips.flatMap((x) => wingsOf(x, genericCrew('navy'))),
      enemyWings: [...enemyShips.flatMap((x) => wingsOf(x, crew)), ...(fighter ? [{ id: `${id}:pw`, classId: fighter, count: fightersN, level: crew, state: 'out' as const, mission: 'screen' as const, warheads: 0, from: null }] : [])],
      rng,
      playerCommands: cmd,
      blockade: { id: b.id, to, direction },
    },
  };
}

export const blockadeById = (id: string): BlockadeDef | undefined => BLOCKADES.find((b) => b.id === id);
export { crewOf };
