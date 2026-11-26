// Ships feature (m8-ship-life, M8 checklist item 13 part 2; D-519; docs-v2/spec/ship-life.md). The code owns every ship the
// character has (Golden Rule 1). New and used ships are bought and sold with `trade` (the economy prices them and sends
// shipAcquired / shipSold); everything else the narrator reports in plain words on the droid event ("ship: salvaged a Dynamic-
// class freighter", "ship: fitted a hidden compartment at a shipyard"), read here (parseShipWhat) into `shipAct`. Travel
// (turn/travel.ts) sends shipTraveled and customsChecked; battles send shipLost and shipRenown. The day hook draws crew wages,
// docking and upkeep through the economy, wears the ships, and lets a stolen ship's owner find it.
import { z } from 'zod';
import { CLASS_SIDES } from '../../data/shipBattles.config';
import {
  CREW,
  CUSTOMS_OUTCOMES,
  DOCK_LIFESTYLE_X,
  HUNTED_WEEKLY,
  MOD_BY_ID,
  MOD_INSTALL,
  type PUSHES,
  SHIP_HOW,
  SHIP_RENOWN,
  START_SHIPS_BY_OPTION,
  WEAR,
  type CrewRole,
  type ShipHold,
  type ShipHow,
} from '../../data/shipLife.config';
import { REPAIR_SHARE, RUNNING_COSTS } from '../../data/shipPrices';
import { SHIP_SPECS } from '../../data/ships';
import { WAGES } from '../../data/economy.config';
import { dateFromAbsDay, SECONDS_PER_DAY } from '../../engine/calendar';
import { shipPrice, usedShipPrice } from '../../engine/economy';
import { basicRoll } from '../../engine/rolls';
import { nextFloat, seedRng, type RngState } from '../../engine/rng';
import { SHIP_CLASSES, shipClass, shipInService } from '../../engine/ships';
import { capacityUsed, classLife, installWays, matchShipClass, modQuote, overCapacity, overhaulQuote, rollBreakdown, wearAfter, yardQuote } from '../../engine/shipLife';
import type { GameState } from '../../state/gameState';
import type { ApplyCtx, FeatureModule, GameEvent, HandleResult, InitCtx } from '../../state/types';
import { selectCharacter } from '../character/selectors';
import { selectHasFlag } from '../flags/selectors';
import { selectNpc } from '../npcs/selectors';
import { selectPresentNpcIds } from '../pacing/selectors';
import { selectPerformance } from '../progression/selectors';
import { selectRank } from '../ranks/selectors';
import { emptyShips, shipsSliceSchema, type CrewMember, type OwnedShip, type ShipsSlice } from './ships';
import { selectShipLines } from './selectors';

type R = HandleResult<ShipsSlice>;

const specOf = (classId: string) => SHIP_SPECS.find((s) => s.id === classId)!;
export const newPrice = (classId: string): number => shipPrice(specOf(classId)).price;
const yearOf = (s: GameState): number => dateFromAbsDay(s.clock.now.day).year;
const today = (s: GameState): number => s.clock.now.day;
const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');

function news(slice: ShipsSlice, day: number, text: string): ShipsSlice['news'] {
  return [...slice.news, { day, text: text.slice(0, 240), told: false }].slice(-30);
}

/** The ship plain words point at: a ship named in them, else the active one, else the only one. */
export function shipNamed(slice: ShipsSlice, words: string | undefined): OwnedShip | null {
  const all = Object.values(slice.ships);
  const t = (words ?? '').toLowerCase();
  const named = all.filter((x) => x.name && t.includes(x.name.toLowerCase())).sort((a, b) => b.name.length - a.name.length)[0];
  const active = slice.activeId ? slice.ships[slice.activeId] : undefined;
  return named ?? active ?? (all.length === 1 ? all[0]! : null);
}

/** Who issues a ship to this character, and what kinds, or why none does (Jared, 26 Nov 2026). */
export function issuerFor(s: GameState, classId: string): { issuer: string; faction: string } | { reject: string } {
  const c = selectCharacter(s);
  const rank = selectRank(s);
  const cls = shipClass(classId);
  const personal = cls.kind !== 'fighter';
  let issuer: { issuer: string; faction: string } | null = null;
  if (c.path === 'jedi') {
    if (!['knight', 'master'].includes(rank)) return { reject: 'the Order issues ships to Knights and Masters; a Padawan flies with their Master' };
    issuer = { issuer: 'the Jedi Order', faction: 'jediOrder' };
  } else if (c.path === 'sith') {
    if (!['apprentice', 'lord', 'darth'].includes(rank)) return { reject: 'the Empire issues ships to Sith from apprentice up; an acolyte has none' };
    issuer = { issuer: 'the Sith Empire', faction: 'sithEmpire' };
  } else {
    const f = c.start?.faction;
    const job = s.economy.job;
    if (f === 'sithEmpire' && (job.kind === 'military' || ['imperial-agent', 'imperial-officer', 'imperial-soldier'].includes(c.start?.optionId ?? ''))) issuer = { issuer: c.start?.optionId === 'imperial-agent' ? 'Imperial Intelligence' : 'the Imperial Navy', faction: 'sithEmpire' };
    else if (f === 'republic' && (job.kind === 'military' || ['republic-pilot', 'republic-trooper', 'sis-agent'].includes(c.start?.optionId ?? ''))) issuer = { issuer: c.start?.optionId === 'sis-agent' ? 'the SIS' : 'the Republic Navy', faction: 'republic' };
  }
  if (!issuer) return { reject: 'only the Jedi Order, the Empire, a navy or an intelligence service issues ships; this character serves none of them' };
  // Commanders and front-line postings fly fleet ships (Jared): no personal ship for one holding fleet command.
  if (personal && selectHasFlag(s, 'fleetCommand')) return { reject: 'a fleet commander flies the fleet\'s ships, not a personal one' };
  const sides = CLASS_SIDES[classId] ?? [];
  const ok = sides.includes(issuer.faction) || (issuer.faction === 'jediOrder' && sides.includes('republic')) || (issuer.faction === 'sithEmpire' && sides.includes('sith'));
  if (!ok) return { reject: `${issuer.issuer} does not fly ${cls.name}s` };
  if (issuer.faction === 'republic' && personal && cls.kind !== 'freighter' && c.start?.optionId !== 'sis-agent') return { reject: 'the Navy issues fighters to its pilots; its capital ships are fleet ships' };
  return issuer;
}

export interface NewShip {
  classId: string;
  how: ShipHow;
  hold?: ShipHold;
  name?: string;
  issuer?: string;
  formerOwner?: string;
  mods?: readonly string[];
  dockedAt?: string | null;
  /** Years since its last overhaul (second-hand, salvage): its wear. */
  wear?: number;
}

/** A new ship record (the next id), active from now. */
export function addShip(slice: ShipsSlice, s: GameState, n: NewShip, day: number): { slice: ShipsSlice; ship: OwnedShip } {
  const life = classLife(n.classId);
  const hold: ShipHold = n.hold ?? (n.how === 'issued' ? 'issued' : n.how === 'stolen' ? 'stolen' : 'owned');
  const id = `ship-${slice.nextId}`;
  const cls = shipClass(n.classId);
  const ship: OwnedShip = {
    id,
    classId: n.classId,
    name: (n.name ?? (cls.name.startsWith('the ') ? cls.name.slice(4) : `a ${cls.name}`)).slice(0, 60),
    owner: hold === 'issued' ? (n.issuer ?? 'the issuer').slice(0, 60) : selectCharacter(s).name.slice(0, 60),
    hold,
    how: n.how,
    issuer: hold === 'issued' ? (n.issuer ?? null) : null,
    transponder: 'real',
    formerOwner: n.formerOwner?.slice(0, 60) ?? null,
    reportedStolen: hold === 'stolen',
    mods: [...(n.mods ?? [])],
    wear: n.wear ?? 0,
    patched: [],
    cargo: [],
    crew: [],
    dockedAt: n.dockedAt ?? null,
    supplies: life.consumablesDays,
    renown: 0,
    flagged: false,
    impounded: false,
    yardUntil: null,
    acquiredDay: day,
    lastOverhaulDay: day,
    priceNew: newPrice(n.classId),
  };
  return { slice: { ...slice, ships: { ...slice.ships, [id]: ship }, activeId: id, nextId: slice.nextId + 1 }, ship };
}

/** The map world the character is on now (for docking), from the location chain's names. */
export function hereWorld(s: GameState): string | null {
  let id: string | null = s.locations.currentId;
  for (let i = 0; i < 10 && id; i++) {
    const l = s.locations.byId[id];
    if (!l) break;
    if (l.kind === 'planet' || l.kind === 'moon' || l.kind === 'station') return l.name;
    id = l.parentId;
  }
  return id ? (s.locations.byId[id]?.name ?? null) : null;
}

// ---------------------------------------------------------------- the plain words

export const SHIP_ACTS = ['salvaged', 'won', 'stolen', 'issued', 'taken', 'renamed', 'transponderAltered', 'transponderRemoved', 'transponderRegistered', 'modInstalled', 'modRemoved', 'yardRepair', 'overhaul', 'crewHired', 'crewDismissed', 'crewPaid', 'cargoLoaded', 'cargoUnloaded', 'pushed', 'reclaimed'] as const;
export type ShipAct = (typeof SHIP_ACTS)[number];

const ACT_WORDS: readonly (readonly [RegExp, ShipAct])[] = [
  [/\breclaim/, 'reclaimed'],
  [/\b(salvag)/, 'salvaged'],
  [/\b(won|wins?|prize|gift|given)\b/, 'won'],
  [/\b(stole|steals?|stolen|hijack)/, 'stolen'],
  [/\b(issued|assigned)\b/, 'issued'],
  [/\b(captured|took|taken|seized)\b.*\b(ship|freighter|fighter|corvette)/, 'taken'],
  [/\brenam/, 'renamed'],
  [/\b(remov|strip|disabl)\w*\b.*\btransponder|\btransponder\b.*\b(remov|strip|disabl)|\bno transponder/, 'transponderRemoved'],
  [/\b(alter|chang|forg|spoof|swap)\w*\b.*\btransponder|\btransponder\b.*\b(alter|chang|forg|spoof|swap)|\bnew (id|identity)|\bfalse (id|transponder)/, 'transponderAltered'],
  [/\bregister/, 'transponderRegistered'],
  [/\b(overhaul)/, 'overhaul'],
  [/\b(repair|fixed|mended)\w*\b.*\b(shipyard|yard|dock|spaceport)|\bshipyard repair/, 'yardRepair'],
  [/\b(remov|strip|uninstall|pull)\w*\b/, 'modRemoved'],
  [/\b(install|fit|fitted|mount|upgrad|add)\w*\b/, 'modInstalled'],
  [/\b(hired?|signs? on|signed on|recruit|took on|takes on)\b/, 'crewHired'],
  [/\b(dismiss|fired|let go|paid off)\b/, 'crewDismissed'],
  [/\bpaid the crew|\bpays? the crew|\bback (wages|pay)/, 'crewPaid'],
  [/\b(unload|deliver|offload|jettison|dumped|sold the cargo)/, 'cargoUnloaded'],
  [/\b(load|took aboard|takes aboard|carry|carries|carrying|stash|smuggl)/, 'cargoLoaded'],
  [/\bemergency jump|\boverload|\bhard manoeuvre|\bhard maneuver|\bpushed|\bran (it )?damaged|running damaged/, 'pushed'],
];

const MOD_WORDS: readonly (readonly [RegExp, string])[] = [
  [/shielded compartment|sensor-shielded|lined compartment/, 'shieldedCompartment'],
  [/compartment|smuggling hold|false bulkhead/, 'compartment'],
  [/transponder mask/, 'transponderMask'],
  [/sensor mask|masking|stealth|baffl/, 'sensorMask'],
  [/hyperdrive/, 'hyperdrive'],
  [/sublight|engine|thruster/, 'engines'],
  [/military|turbolaser|torpedo|launcher|warhead/, 'militaryWeapons'],
  [/gun|cannon|laser|turret|weapon/, 'weapons'],
  [/shield/, 'shields'],
  [/armou?r|plating/, 'armour'],
  [/nav ?computer|chart/, 'navCharts'],
  [/jammer/, 'jammer'],
  [/sensor|scanner/, 'sensors'],
  [/cargo|hold expansion/, 'cargo'],
];
export const modFromWords = (t: string): string | null => MOD_WORDS.find(([re]) => re.test(t))?.[1] ?? null;

const ROLE_WORDS: readonly (readonly [RegExp, CrewRole])[] = [
  [/co-?pilot/, 'copilot'],
  [/pilot/, 'pilot'],
  [/gunner/, 'gunner'],
  [/engineer|mechanic|tech/, 'engineer'],
  [/medic|doctor|healer/, 'medic'],
];
const CONTRABAND = /spice|glitterstim|weapons?|blasters?|explosive|stolen|contraband|slaves?|death sticks|illegal|black market|droid parts/;

export interface ParsedShipWhat {
  act: ShipAct;
  words: string;
  shipId: string | null;
}

/** The narrator's plain words for a ship act (the droid event's `what` after "ship:"), or why they cannot be read. */
export function parseShipWhat(slice: ShipsSlice, what: string): ParsedShipWhat | { reject: string } {
  const t = what.toLowerCase().replace(/^\s*ship\s*:\s*/, '');
  const act = ACT_WORDS.find(([re]) => re.test(t))?.[1];
  if (!act) return { reject: `"${what}" names no ship act the engine reads (salvaged, won, stole, issued, renamed, the transponder, a mod fitted or removed, shipyard repairs, an overhaul, crew hired or dismissed, cargo loaded or unloaded, pushed)` };
  const acquiring = act === 'salvaged' || act === 'won' || act === 'stolen' || act === 'issued' || act === 'taken';
  return { act, words: t, shipId: acquiring ? null : (shipNamed(slice, t)?.id ?? null) };
}

// ---------------------------------------------------------------- handlers

function acquire(slice: ShipsSlice, s: GameState, how: ShipHow, words: string): R {
  const year = yearOf(s);
  const m = matchShipClass(words, year, SHIP_CLASSES, (c) => newPrice(c.id));
  if (!m) return { reject: `"${words}" names no ship class the engine knows; name the class ("a Dynamic-class freighter", "an Aurek")` };
  if ('reject' in m) return { reject: m.reject };
  let issuer: string | undefined;
  if (how === 'issued') {
    const i = issuerFor(s, m.classId);
    if ('reject' in i) return { reject: i.reject };
    issuer = i.issuer;
  }
  const named = /\b(?:named|called)\s+(?:the\s+)?([a-z0-9' -]{2,40})/i.exec(words)?.[1]?.trim();
  const from = /\bfrom\s+(?:the\s+)?([a-z0-9' -]{2,40})/i.exec(words)?.[1]?.trim();
  const [u, rng] = nextFloat(s.meta.rngState);
  // A ship with a past: salvage is worn, a prize or a theft half way (invented).
  const wear = how === 'salvaged' ? 0.6 + 0.3 * u : how === 'won' || how === 'stolen' || how === 'taken' ? 0.2 + 0.4 * u : 0;
  const r = addShip(slice, s, { classId: m.classId, how, ...(named ? { name: named.replace(/\b\w/g, (x) => x.toUpperCase()) } : {}), ...(issuer ? { issuer } : {}), ...(how === 'stolen' && from ? { formerOwner: from } : {}), dockedAt: hereWorld(s), wear }, today(s));
  const note = `${r.ship.name} (${shipClass(m.classId).name}) ${how === 'issued' ? `issued by ${issuer}` : how}${how === 'stolen' ? ': its old transponder still reads; the owner may hunt it' : ''}`;
  return { slice: { ...r.slice, news: news(r.slice, today(s), note) }, rng, notes: [note] };
}

function act(slice: ShipsSlice, s: GameState, p: ParsedShipWhat): R {
  const day = today(s);
  if (p.act === 'salvaged' || p.act === 'won' || p.act === 'stolen' || p.act === 'issued' || p.act === 'taken') return acquire(slice, s, p.act, p.words);
  const ship = p.shipId ? slice.ships[p.shipId] : null;
  if (!ship) return { reject: 'no ship of the character\'s to do that with' };
  const put = (x: OwnedShip, note: string, extra: Partial<R & { emit: GameEvent[] }> = {}): R => ({ slice: { ...slice, ships: { ...slice.ships, [x.id]: x }, news: news(slice, day, note) }, notes: [note], ...extra });
  const atYard = /\b(shipyard|yard|dock|spaceport|repair bay)/.test(p.words);
  switch (p.act) {
    case 'renamed': {
      const to = /\b(?:to|as)\s+(?:the\s+)?([a-z0-9' -]{2,40})$/i.exec(p.words)?.[1]?.trim();
      if (!to) return { reject: 'renamed to what? ("renamed the ship to the Nightrunner")' };
      const name = to.replace(/\b\w/g, (x) => x.toUpperCase());
      // A new name on the old transponder is still the old ship to a scan; renown follows the ship's look, so it keeps it.
      return put({ ...ship, name }, `${ship.name} renamed ${name}`);
    }
    case 'transponderAltered':
    case 'transponderRemoved':
    case 'transponderRegistered': {
      const transponder = p.act === 'transponderAltered' ? 'altered' : p.act === 'transponderRemoved' ? 'missing' : 'real';
      if (p.act === 'transponderRegistered' && ship.hold === 'stolen') return { reject: 'a stolen ship cannot be registered under a legal code without forged papers and a slicer: alter the transponder instead' };
      // A changed ID: no longer flagged, no longer read as the stolen ship, its renown left behind (design notes).
      const next: OwnedShip = { ...ship, transponder, flagged: false, reportedStolen: false, renown: 0 };
      const cost: GameEvent[] = p.act === 'transponderAltered' ? [{ type: 'creditsCharged', credits: 10000, reason: `altering the transponder of ${ship.name}`, lender: 'hutt' }] : [];
      return put(next, `${ship.name}: transponder ${transponder === 'altered' ? 'altered (a new identity; illegal)' : transponder === 'missing' ? 'removed (no ID: intense scrutiny in civilised systems)' : 'registered'}`, { emit: cost });
    }
    case 'modInstalled': {
      const id = modFromWords(p.words);
      const m = id ? MOD_BY_ID.get(id) : undefined;
      if (!m) return { reject: 'which modification? (hyperdrive, engines, guns, military weapons, shields, armour, sensors, jammer, navicomputer charts, cargo, a hidden compartment, sensor masking, a transponder mask)' };
      if (m.from !== undefined && yearOf(s) < m.from) return { reject: `${m.name} is not made yet` };
      if (ship.mods.includes(m.id) && m.id !== 'compartment') return { reject: `${ship.name} already has ${m.name}` };
      const kit = /\bkit\b|factory/.test(p.words);
      const ways = installWays(m, atYard);
      const way = kit && ways.includes('kit') ? 'kit' : atYard ? 'yard' : ways.includes('field') ? 'field' : null;
      if (!way) return { reject: `${m.name} is a big job: it needs a shipyard` };
      const q = modQuote(m, ship.priceNew, way);
      let rng = s.meta.rngState;
      let ok = true;
      const notes: string[] = [];
      if (q.roll) {
        const [roll, r] = basicRoll(rng, Math.max(selectPerformance(s, 'repair'), ...ship.crew.filter((c) => c.role === 'engineer').map((c) => (c.npcId ? 0 : CREW.level.engineer))), []);
        rng = r;
        ok = roll.total * 1 >= MOD_INSTALL.fieldRating / 10 + 10;
        notes.push(`Repair roll ${roll.total.toFixed(1)} against ${MOD_INSTALL.fieldRating / 10 + 10}`);
      }
      const credits = ok ? q.credits : Math.round(q.credits * MOD_INSTALL.failLoss);
      const over = overCapacity(ship.classId, [...ship.mods, m.id]);
      const next: OwnedShip = ok ? { ...ship, mods: [...ship.mods, m.id], ...(way === 'yard' ? { yardUntil: day + Math.ceil(q.hours / 24) } : {}) } : ship;
      const note = ok
        ? `${ship.name}: ${m.name} installed (${way === 'yard' ? 'at a shipyard' : way === 'kit' ? 'a factory kit' : 'by the crew'}; ${fmt(credits)} cr; ${capacityUsed(next.mods)}/${classLife(ship.classId).capacity} capacity${over > 0 ? `, ${over} over: more breakdowns` : ''})${m.legality !== 'legal' ? '; illegal in Republic and Imperial space' : ''}`
        : `${ship.name}: fitting ${m.name} failed; half the parts are spoiled (${fmt(credits)} cr)`;
      return { ...put(next, note), rng, notes: [...notes, note], emit: [{ type: 'creditsCharged', credits, reason: `${m.name} for ${ship.name}`.slice(0, 120), lender: 'bank' }] };
    }
    case 'modRemoved': {
      const id = modFromWords(p.words);
      if (!id || !ship.mods.includes(id)) return { reject: `${ship.name} has no such modification` };
      const i = ship.mods.indexOf(id);
      return put({ ...ship, mods: [...ship.mods.slice(0, i), ...ship.mods.slice(i + 1)] }, `${ship.name}: ${MOD_BY_ID.get(id)?.name ?? id} removed`);
    }
    case 'yardRepair': {
      const cond = s.battles.ships[ship.id];
      const maxHull = shipClass(ship.classId).hull;
      const q = yardQuote(ship.classId, ship.priceNew, cond ? Math.max(0, cond.hull) / Math.max(1, maxHull) : 1, cond?.systems ?? {}, REPAIR_SHARE);
      if (q.level === 'none' && !ship.patched.length) return { reject: `${ship.name} needs no repairs` };
      const issued = ship.hold === 'issued';
      const emit: GameEvent[] = [{ type: 'shipConditionSet', shipId: ship.id, classId: ship.classId, name: ship.name, restore: true }];
      if (!issued && q.credits > 0) emit.push({ type: 'creditsCharged', credits: q.credits, reason: `shipyard repairs to ${ship.name} (${q.level})`.slice(0, 120), lender: 'bank' });
      const note = `${ship.name} repaired at a shipyard (${q.level} damage; ${issued ? `${ship.issuer} pays` : `${fmt(q.credits)} cr`}; ${q.days} days in the yard)`;
      return put({ ...ship, patched: [], yardUntil: day + q.days, wear: wearAfter(ship.wear, { hullLost: -0.2 }) }, note, { emit });
    }
    case 'overhaul': {
      const q = overhaulQuote(ship.classId, ship.priceNew);
      const issued = ship.hold === 'issued';
      const note = `${ship.name} overhauled (${issued ? `${ship.issuer} pays` : `${fmt(q.credits)} cr`}; ${q.days} days): wear cleared`;
      return put({ ...ship, wear: 0, patched: [], lastOverhaulDay: day, yardUntil: day + q.days }, note, { emit: issued ? [] : [{ type: 'creditsCharged', credits: q.credits, reason: `overhaul of ${ship.name}`, lender: 'bank' }] });
    }
    case 'crewHired': {
      const role = ROLE_WORDS.find(([re]) => re.test(p.words))?.[1] ?? 'hand';
      const present = selectPresentNpcIds(s).map((id) => selectNpc(s, id)).filter((n) => n !== null);
      const npc = present.find((n) => p.words.includes(n.name.toLowerCase()) || p.words.includes(n.name.toLowerCase().split(' ')[0]!));
      const pay = /\bshare|\bcut\b/.test(p.words) ? 'share' : /\bloyal|\bfriend|\bcompanion|\bfor free|\bno pay/.test(p.words) ? 'loyalty' : 'wage';
      const name = npc?.name ?? /\bnamed\s+([a-z' -]{2,30})/i.exec(p.words)?.[1]?.replace(/\b\w/g, (x) => x.toUpperCase()) ?? `a ${role}`;
      const member: CrewMember = { id: `crew-${slice.nextCrewId}`, name: name.slice(0, 60), npcId: npc?.id ?? null, role, pay, loyalty: CREW.startLoyalty[pay], hiredDay: day, unpaidMonths: 0 };
      const next = { ...ship, crew: [...ship.crew, member] };
      const note = `${member.name} joins ${ship.name} as ${role} (${pay === 'wage' ? `${fmt(WAGES[CREW.wageTier[role]])} cr a month` : pay === 'share' ? `a ${Math.round(CREW.share * 100)}% share of earnings` : 'for loyalty'})`;
      return { slice: { ...slice, ships: { ...slice.ships, [ship.id]: next }, nextCrewId: slice.nextCrewId + 1, news: news(slice, day, note) }, notes: [note] };
    }
    case 'crewDismissed': {
      const c = ship.crew.find((x) => p.words.includes(x.name.toLowerCase())) ?? ship.crew.find((x) => ROLE_WORDS.find(([re]) => re.test(p.words))?.[1] === x.role);
      if (!c) return { reject: 'no such crew member aboard' };
      return put({ ...ship, crew: ship.crew.filter((x) => x.id !== c.id) }, `${c.name} leaves ${ship.name}'s crew`);
    }
    case 'crewPaid': {
      const owed = ship.crew.filter((c) => c.pay === 'wage' && c.unpaidMonths > 0);
      if (!owed.length) return { reject: 'no back wages are owed' };
      const credits = owed.reduce((t, c) => t + c.unpaidMonths * WAGES[CREW.wageTier[c.role]], 0);
      const crew = ship.crew.map((c) => (c.pay === 'wage' && c.unpaidMonths > 0 ? { ...c, unpaidMonths: 0, loyalty: Math.min(5, c.loyalty + 1) } : c));
      return put({ ...ship, crew }, `back wages paid on ${ship.name} (${fmt(credits)} cr)`, { emit: [{ type: 'creditsCharged', credits, reason: `back wages for ${ship.name}'s crew`, lender: 'bank' }] });
    }
    case 'cargoLoaded': {
      const units = Number(/\b(\d{1,4})\b/.exec(p.words)?.[1] ?? 1);
      const what = p.words.replace(/^.*?\b(load(ed)?|took aboard|carry(ing)?|stash(ed)?|smuggl(ed|ing))\b\s*/, '').slice(0, 60) || 'cargo';
      const hidden = /\bhidden|compartment|stash|secret/.test(p.words);
      const contraband = CONTRABAND.test(p.words) || /\bsmuggl/.test(p.words);
      const life = classLife(ship.classId);
      const held = ship.cargo.reduce((t, c) => t + c.units, 0);
      const cap = Math.max(1, Math.round(life.cargoT * (ship.mods.includes('cargo') ? 1.5 : 1)));
      if (held + units > cap) return { reject: `${ship.name} holds ${cap} units (tons); ${held} are aboard` };
      if (hidden && !ship.mods.some((m) => m === 'compartment' || m === 'shieldedCompartment') && !life.builtInCompartments) return { reject: `${ship.name} has no hidden compartment` };
      return put({ ...ship, cargo: [...ship.cargo, { what, units: Math.max(1, units), contraband, hidden }].slice(-30) }, `${ship.name} loads ${units} ${what}${hidden ? ' in a hidden compartment' : ''}${contraband ? ' (contraband)' : ''}`);
    }
    case 'cargoUnloaded': {
      if (!ship.cargo.length) return { reject: `${ship.name} carries no cargo` };
      const keep = ship.cargo.filter((c) => !p.words.includes(c.what.split(' ')[0] ?? '~'));
      const cargo = keep.length === ship.cargo.length ? [] : keep;
      return put({ ...ship, cargo }, `${ship.name} unloads ${cargo.length ? 'part of its cargo' : 'its cargo'}`);
    }
    case 'pushed': {
      const push = /emergency jump/.test(p.words) ? 'emergencyJump' : /overload/.test(p.words) ? 'overload' : /damaged/.test(p.words) ? 'runningDamaged' : 'hardManoeuvres';
      return pushShip(slice, s, ship, push);
    }
    case 'reclaimed': {
      if (!ship.impounded) return { reject: `${ship.name} is not impounded` };
      const fee = Math.round(ship.priceNew * 0.2);
      return put({ ...ship, impounded: false }, `${ship.name} reclaimed from impound (${fmt(fee)} cr)`, { emit: [{ type: 'creditsCharged', credits: fee, reason: `reclaiming ${ship.name} from impound`, lender: 'bank' }] });
    }
    default:
      return { reject: `unhandled ship act ${p.act}` };
  }
}

const damagedNow = (s: GameState, id: string): boolean => Object.values(s.battles.ships[id]?.systems ?? {}).some((v) => v === 'damaged' || v === 'disabled');

/** The ship pushed (an emergency jump, overloaded systems, hard manoeuvres, running damaged): a breakdown roll. */
export function pushShip(slice: ShipsSlice, s: GameState, ship: OwnedShip, push: (typeof PUSHES)[number]): R {
  const day = today(s);
  const [b, rng] = rollBreakdown(s.meta.rngState, { wear: ship.wear, over: overCapacity(ship.classId, ship.mods), damaged: damagedNow(s, ship.id), patched: ship.patched }, push);
  const emit: GameEvent[] = [];
  const lines: string[] = [];
  const systems: Record<string, 'damaged'> = {};
  for (const p of b.patchesFailed) {
    systems[p] = 'damaged';
    lines.push(`the patch on the ${p} gives way`);
  }
  if (b.broke && b.system) {
    systems[b.system] = 'damaged';
    lines.push(`the ${b.system} breaks down (${b.hours} h lost)`);
  }
  if (Object.keys(systems).length) emit.push({ type: 'shipConditionSet', shipId: ship.id, classId: ship.classId, name: ship.name, systems });
  const text = lines.length ? `${ship.name} pushed (${push}): ${lines.join('; ')}` : `${ship.name} pushed (${push}): it holds (${Math.round(b.chance * 1000) / 10}% chance of a breakdown)`;
  const next: OwnedShip = { ...ship, patched: ship.patched.filter((x) => !b.patchesFailed.includes(x)), wear: wearAfter(ship.wear, { jumps: 1 }) };
  return { slice: { ...slice, ships: { ...slice.ships, [ship.id]: next }, news: news(slice, day, text) }, emit, rng, notes: [text] };
}

// ---------------------------------------------------------------- setup and old saves

/** The starting ship of a start option (START_SHIPS_BY_OPTION), with its mods and a name from the campaign seed. */
function startShips(ctx: { seed: string; start: { day: number }; character: InitCtx['character'] }, dockedAt: string | null): ShipsSlice {
  const o = ctx.character.start ? START_SHIPS_BY_OPTION[ctx.character.start.optionId] : undefined;
  const slice = emptyShips();
  if (!o) return slice;
  const year = dateFromAbsDay(ctx.start.day).year;
  const cls = SHIP_CLASSES.find((c) => c.id === o.classId);
  if (!cls || !shipInService(cls, year)) return slice;
  const [u] = nextFloat(seedRng(`${ctx.seed}:ship`));
  const name = o.names[Math.floor(u * o.names.length) % o.names.length]!;
  const life = classLife(o.classId);
  const id = 'ship-1';
  const ship: OwnedShip = {
    id,
    classId: o.classId,
    name,
    owner: o.hold === 'issued' ? (ctx.character.start?.faction === 'sithEmpire' ? 'the Imperial Navy' : 'the Republic Navy') : ctx.character.name.slice(0, 60),
    hold: o.hold,
    how: o.how,
    issuer: o.hold === 'issued' ? (ctx.character.start?.faction === 'sithEmpire' ? 'the Imperial Navy' : 'the Republic Navy') : null,
    transponder: 'real',
    formerOwner: null,
    reportedStolen: false,
    mods: [...o.mods],
    wear: o.hold === 'owned' ? 0.3 : 0.1,
    patched: [],
    cargo: [],
    crew: [],
    dockedAt,
    supplies: life.consumablesDays,
    renown: 0,
    flagged: false,
    impounded: false,
    yardUntil: null,
    acquiredDay: ctx.start.day,
    lastOverhaulDay: ctx.start.day,
    priceNew: newPrice(o.classId),
  };
  return { ...slice, ships: { [id]: ship }, activeId: id, nextId: 2 };
}

const START_WORLD: Readonly<Record<string, string>> = { 'underworld-smuggler': 'Nar Shaddaa' };

export function initialShips(ctx: InitCtx): ShipsSlice {
  return startShips(ctx, ctx.character.start ? (START_WORLD[ctx.character.start.optionId] ?? null) : null);
}

/**
 * A save made before ship life: the start's ship as of now (the smuggler's modified freighter, the pilot's issued fighter), and
 * the ship the last battle left the player in (D-517 kept its condition) as theirs: issued for a Jedi, Sith or a serving
 * soldier, owned otherwise.
 */
function emptyShipsFor(raw: Record<string, unknown>): ShipsSlice {
  const c = (raw['character'] ?? {}) as InitCtx['character'];
  const clock = (raw['clock'] ?? { now: { day: 0 } }) as { now: { day: number } };
  const meta = (raw['meta'] ?? { campaignId: '' }) as { campaignId: string };
  let slice = startShips({ seed: meta.campaignId, start: { day: clock.now.day }, character: c }, c.start ? (START_WORLD[c.start.optionId] ?? null) : null);
  const battles = (raw['battles'] ?? null) as { ships?: Record<string, { id: string; classId: string; name: string }>; lastShipId?: string | null } | null;
  const last = battles?.lastShipId ? battles.ships?.[battles.lastShipId] : undefined;
  if (last && SHIP_CLASSES.some((x) => x.id === last.classId) && !Object.values(slice.ships).some((x) => x.classId === last.classId)) {
    const issued = c.path === 'jedi' || c.path === 'sith' || ((raw['economy'] as { job?: { kind?: string } } | undefined)?.job?.kind === 'military');
    const life = classLife(last.classId);
    const ship: OwnedShip = { id: last.id, classId: last.classId, name: last.name.slice(0, 60), owner: issued ? 'the issuer' : (c.name ?? '').slice(0, 60), hold: issued ? 'issued' : 'owned', how: issued ? 'issued' : 'bought', issuer: issued ? (c.path === 'jedi' ? 'the Jedi Order' : c.path === 'sith' ? 'the Sith Empire' : 'the Navy') : null, transponder: 'real', formerOwner: null, reportedStolen: false, mods: [], wear: 0.2, patched: [], cargo: [], crew: [], dockedAt: null, supplies: life.consumablesDays, renown: 0, flagged: false, impounded: false, yardUntil: null, acquiredDay: clock.now.day, lastOverhaulDay: clock.now.day, priceNew: newPrice(last.classId) };
    slice = { ...slice, ships: { ...slice.ships, [ship.id]: ship }, activeId: ship.id };
  }
  return slice;
}

// ---------------------------------------------------------------- the day hook

function dayHook(slice: ShipsSlice, endedDay: number, ctx: ApplyCtx<GameState>): { slice: ShipsSlice; emit: GameEvent[]; notices: string[]; rng?: RngState } {
  const s = ctx.state;
  const next = endedDay + 1;
  const first = dateFromAbsDay(next).day === 1;
  const items: { credits: number; reason: string; shipId?: string; crewId?: string; upkeep?: boolean }[] = [];
  const notices: string[] = [];
  let out = slice;
  let rng = s.meta.rngState;
  let rolled = false;
  const lifestyle = s.economy.lifestyle;
  for (const ship of Object.values(slice.ships)) {
    let x = ship;
    const cls = shipClass(ship.classId);
    const run = RUNNING_COSTS[cls.kind];
    const issued = ship.hold === 'issued';
    // Docking a day (the issuer pays for an issued ship; nothing while impounded or in a yard).
    if (!issued && ship.dockedAt && !ship.impounded && (ship.yardUntil === null || ship.yardUntil <= endedDay)) {
      const dock = Math.round(run.dockingPerDay * (DOCK_LIFESTYLE_X[lifestyle] ?? 1));
      if (dock > 0) items.push({ credits: dock, reason: `docking ${ship.name}` });
    }
    if (ship.yardUntil !== null && ship.yardUntil <= next) {
      x = { ...x, yardUntil: null };
      notices.push(`${ship.name} is out of the shipyard`);
    }
    if (first) {
      x = { ...x, wear: wearAfter(x.wear, { months: 1 }) };
      // Upkeep is maintenance: missed, it wears the ship rather than running up a debt (a reading; WEAR.missedUpkeep).
      if (!issued) items.push({ credits: Math.round(ship.priceNew * run.upkeepShare), reason: `upkeep of ${ship.name}`, shipId: ship.id, upkeep: true });
      for (const c of x.crew) if (c.pay === 'wage') items.push({ credits: WAGES[CREW.wageTier[c.role]], reason: `wages: ${c.name} (${ship.name})`, shipId: ship.id, crewId: c.id });
    }
    // A stolen ship's owner finds it while its old transponder still reads (weekly).
    if (ship.hold === 'stolen' && ship.reportedStolen && ship.transponder === 'real' && dateFromAbsDay(next).day % 7 === 0) {
      const [u, r] = nextFloat(rng);
      rng = r;
      rolled = true;
      if (u < HUNTED_WEEKLY) {
        const text = `${ship.formerOwner ?? 'the original owner'}'s people have found ${ship.name}: hunters are on its trail`;
        out = { ...out, news: news(out, next, text) };
        notices.push(text);
      }
    }
    out = { ...out, ships: { ...out.ships, [ship.id]: x } };
  }
  const emit: GameEvent[] = items.length ? [{ type: 'shipCostsDue', items }] : [];
  return { slice: out, emit, notices, ...(rolled ? { rng } : {}) };
}

// ---------------------------------------------------------------- the module

export const shipsFeature: FeatureModule<ShipsSlice, GameState> = {
  id: 'ships',
  version: 1,
  initialState: initialShips,
  emptyState: emptyShipsFor,
  stateSchema: shipsSliceSchema,
  events: {
    /** Engine: a ship had (the economy's trade, a start, a shipAct, a battle prize). */
    shipAcquired: {
      schema: z.object({ type: z.literal('shipAcquired'), classId: z.string(), how: z.enum(SHIP_HOW), name: z.string().max(60).optional(), issuer: z.string().max(60).optional(), mods: z.array(z.string()).max(20).optional(), wear: z.number().min(0).max(1).optional() }),
      sources: ['engine', 'dev'],
      handle: (slice, e, ctx) => {
        const s = ctx.state;
        const classId = String(e['classId']);
        if (!SHIP_CLASSES.some((c) => c.id === classId)) return { reject: `unknown ship class ${classId}` };
        if (!shipInService(shipClass(classId), yearOf(s))) return { reject: `${shipClass(classId).name} is not in service this year` };
        const how = e['how'] as ShipHow;
        const r = addShip(slice, s, { classId, how, ...(typeof e['name'] === 'string' ? { name: e['name'] } : {}), ...(typeof e['issuer'] === 'string' ? { issuer: e['issuer'] } : {}), ...(Array.isArray(e['mods']) ? { mods: e['mods'] as string[] } : {}), ...(typeof e['wear'] === 'number' ? { wear: e['wear'] } : {}), dockedAt: hereWorld(s) }, today(s));
        return { slice: r.slice, notes: [`ship: ${r.ship.name} (${shipClass(classId).name}), ${how}`] };
      },
    },
    /** Engine: a ship sold or fenced (the economy's trade). */
    shipSold: {
      schema: z.object({ type: z.literal('shipSold'), shipId: z.string() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const x = slice.ships[String(e['shipId'])];
        if (!x) return { reject: 'no such ship' };
        const { [x.id]: _gone, ...ships } = slice.ships;
        return { slice: { ...slice, ships, activeId: slice.activeId === x.id ? (Object.keys(ships)[0] ?? null) : slice.activeId, gone: [...slice.gone, { id: x.id, name: x.name, classId: x.classId, day: today(ctx.state), how: 'sold' }].slice(-30) }, notes: [`${x.name} sold`] };
      },
    },
    /** Engine (the droid event's "ship:" words) or player: an act on a ship in plain words. */
    shipAct: {
      // Its own AI event since m8-ground (D-520): the schema's parts made the room; the droid event's "ship:" words still route here.
      schema: z.object({ type: z.literal('shipAct'), what: z.string().max(120).describe('A ship act in plain words (STATE: SHIPS)') }),
      sources: ['ai', 'engine', 'player', 'dev'],
      narrative: () => true,
      part: 'ship',
      handle: (slice, e, ctx) => {
        const p = parseShipWhat(slice, String(e['what']));
        if ('reject' in p) return { reject: p.reject };
        return act(slice, ctx.state, p);
      },
    },
    /** Engine (turn/travel.ts): a trip made in the ship: where it docks, supplies used, wear, a breakdown in transit. */
    shipTraveled: {
      schema: z.object({ type: z.literal('shipTraveled'), shipId: z.string(), to: z.string().max(80), jumps: z.number().int().min(0), days: z.number().min(0), breakdown: z.string().max(40).nullable().optional(), resupplied: z.boolean().optional() }),
      sources: ['engine'],
      handle: (slice, e) => {
        const x = slice.ships[String(e['shipId'])];
        if (!x) return { reject: 'no such ship' };
        const life = classLife(x.classId);
        const days = Number(e['days']);
        const used = Math.max(0, x.supplies - days);
        const next: OwnedShip = { ...x, dockedAt: String(e['to']), supplies: e['resupplied'] === true ? life.consumablesDays : used, wear: wearAfter(x.wear, { jumps: Number(e['jumps']) }) };
        return { slice: { ...slice, ships: { ...slice.ships, [x.id]: next }, activeId: x.id }, notes: [`${x.name} docks at ${String(e['to'])}`] };
      },
    },
    /** Engine (turn/travel.ts): a customs check on arrival, as it came out (engine/shipLife runCustoms). */
    customsChecked: {
      schema: z.object({ type: z.literal('customsChecked'), shipId: z.string(), world: z.string().max(80), outcome: z.enum(CUSTOMS_OUTCOMES), found: z.array(z.string().max(80)).max(12), fine: z.number().int().min(0), bribe: z.number().int().min(0), flag: z.boolean(), inspector: z.string().max(20) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const x = slice.ships[String(e['shipId'])];
        if (!x) return { reject: 'no such ship' };
        const outcome = e['outcome'] as (typeof CUSTOMS_OUTCOMES)[number];
        const day = today(ctx.state);
        const emit: GameEvent[] = [];
        let next: OwnedShip = { ...x, flagged: x.flagged || e['flag'] === true };
        if (Number(e['fine']) > 0) emit.push({ type: 'creditsCharged', credits: Number(e['fine']), reason: `customs fine at ${String(e['world'])}`.slice(0, 120), lender: 'bank' });
        if (Number(e['bribe']) > 0) emit.push({ type: 'creditsCharged', credits: Number(e['bribe']), reason: `a bribe to the inspector at ${String(e['world'])}`.slice(0, 120), lender: 'bank' });
        if (outcome === 'impoundCargo') next = { ...next, cargo: next.cargo.filter((c) => !c.contraband) };
        if (outcome === 'impoundShip' || outcome === 'arrest') next = { ...next, impounded: true, cargo: next.cargo.filter((c) => !c.contraband) };
        if (outcome === 'arrest') emit.push({ type: 'captivityBegan', source: 'customs', sourceId: x.id, group: `the ${String(e['inspector']) === 'military' ? 'military' : 'port'} authorities at ${String(e['world'])}`.slice(0, 200), kind: null, names: [], weapon: null, security: 55, atAbs: ctx.state.clock.now.day * SECONDS_PER_DAY + ctx.state.clock.now.second });
        if (outcome === 'chase') emit.push({ type: 'shipBattleProposed', what: `enemy: two patrol fighters; mine: ${shipClass(x.classId).name}`, chase: true });
        const found = (e['found'] as string[]).slice(0, 12);
        const text = `customs at ${String(e['world'])}: ${outcome}${found.length ? ` (${found.join('; ')})` : ''}`;
        return { slice: { ...slice, ships: { ...slice.ships, [x.id]: next }, lastCustoms: { day, world: String(e['world']).slice(0, 80), outcome, found, told: false } }, emit, notes: [text] };
      },
    },
    /** Engine (the economy): a crew member's wages could not be paid this month. */
    crewUnpaid: {
      schema: z.object({ type: z.literal('crewUnpaid'), shipId: z.string(), crewId: z.string() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const x = slice.ships[String(e['shipId'])];
        const c = x?.crew.find((m) => m.id === e['crewId']);
        if (!x || !c) return { reject: 'no such crew member' };
        const loyalty = Math.max(0, c.loyalty - CREW.unpaidLoss);
        const leaves = loyalty <= 0;
        const crew = leaves ? x.crew.filter((m) => m.id !== c.id) : x.crew.map((m) => (m.id === c.id ? { ...m, loyalty, unpaidMonths: m.unpaidMonths + 1 } : m));
        const text = leaves ? `${c.name} walks off ${x.name}: unpaid too long` : `${c.name} was not paid this month (loyalty ${loyalty})`;
        return { slice: { ...slice, ships: { ...slice.ships, [x.id]: { ...x, crew } }, news: news(slice, today(ctx.state), text) }, notes: [text] };
      },
    },
    /** Engine (battles): the player's ship was destroyed, abandoned or taken. */
    shipLost: {
      schema: z.object({ type: z.literal('shipLost'), shipId: z.string(), how: z.string().max(40) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const x = slice.ships[String(e['shipId'])];
        if (!x) return { slice };
        const { [x.id]: _gone, ...ships } = slice.ships;
        return { slice: { ...slice, ships, activeId: slice.activeId === x.id ? (Object.keys(ships)[0] ?? null) : slice.activeId, gone: [...slice.gone, { id: x.id, name: x.name, classId: x.classId, day: today(ctx.state), how: String(e['how']) }].slice(-30) }, notes: [`${x.name} lost (${String(e['how'])})`] };
      },
    },
    /** Engine (battles, blockade runs): ship renown from a deed done in it. */
    shipRenown: {
      schema: z.object({ type: z.literal('shipRenown'), shipId: z.string(), points: z.number().int() }),
      sources: ['engine'],
      handle: (slice, e) => {
        const x = slice.ships[String(e['shipId'])];
        if (!x) return { slice };
        const renown = Math.max(0, Math.min(SHIP_RENOWN.max, x.renown + Number(e['points'])));
        return { slice: { ...slice, ships: { ...slice.ships, [x.id]: { ...x, renown } } }, notes: [`${x.name}: renown ${renown}`] };
      },
    },
    /** Engine (the economy): a month's upkeep could not be paid: the ship wears faster instead of the debt growing. */
    shipUpkeepMissed: {
      schema: z.object({ type: z.literal('shipUpkeepMissed'), shipId: z.string() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const x = slice.ships[String(e['shipId'])];
        if (!x) return { slice };
        const text = `${x.name}'s upkeep went unpaid this month: it is wearing faster`;
        return { slice: { ...slice, ships: { ...slice.ships, [x.id]: { ...x, wear: Math.min(1, x.wear + WEAR.missedUpkeep) } }, news: news(slice, today(ctx.state), text) }, notes: [text] };
      },
    },
    /** Engine (battles' field repairs): systems patched in the field, temporary until a shipyard repairs them. */
    shipPatched: {
      schema: z.object({ type: z.literal('shipPatched'), shipId: z.string(), systems: z.array(z.string()).max(20) }),
      sources: ['engine'],
      handle: (slice, e) => {
        const x = slice.ships[String(e['shipId'])];
        if (!x) return { slice };
        const patched = [...new Set([...x.patched, ...(e['systems'] as string[])])].slice(0, 20);
        return { slice: { ...slice, ships: { ...slice.ships, [x.id]: { ...x, patched } } } };
      },
    },
    /** Engine: the narration was shown the ships' news and the last customs check. */
    shipsTold: {
      schema: z.object({ type: z.literal('shipsTold') }),
      sources: ['engine'],
      handle: (slice) => ({ slice: { ...slice, news: slice.news.map((n) => ({ ...n, told: true })), lastCustoms: slice.lastCustoms ? { ...slice.lastCustoms, told: true } : null } }),
    },
  },
  onTimeAdvanced: (slice, step, ctx) => {
    if (!step.endsDay || !Object.keys(slice.ships).length) return { slice };
    const ended = Math.floor(step.toAbs / SECONDS_PER_DAY) - 1;
    const r = dayHook(slice, ended, ctx);
    return { slice: r.slice, ...(r.emit.length ? { emit: r.emit } : {}), ...(r.notices.length ? { notices: r.notices } : {}), ...(r.rng ? { rng: r.rng } : {}) };
  },
  selectors: { lines: selectShipLines },
};

export { WEAR, usedShipPrice };
