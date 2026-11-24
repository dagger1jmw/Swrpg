import { CANON_DEATH_LINKS } from '../../data/canonDeathLinks';
import { SECRET_OVERLAP } from '../../data/worldNetwork.config';
import { CANON_BY_ID, CANON_NPCS, type CanonNpc } from '../../data/canonNpcs';
import { ORDER_SEATS, type OrderSeat } from '../../data/orderSeats';
import type { BlockadeDef } from '../../data/blockades';
import type { Runner } from '../../engine/blockade';
import { FACTION_LEADERS, placeAmong, type LeaderSpan } from '../../data/worldControl';
import { WORLD_NETWORK, type Lead, type RoleTag, type WorldNetwork } from '../../data/worldNetwork';
import { normalizeText } from '../../engine/aliases';
import { dateFromAbsDay } from '../../engine/calendar';
import { canonFactionAt, canonPresentAt, canonRankAt, canonRoleAt, withoutDeath } from '../../engine/canonRoster';
import { datedFactsAt, type HeldReason } from '../../engine/datedFacts';
import type { GameState } from '../../state/gameState';
import { selectTurnInPlay } from '../clock/selectors';
import { selectLastFight } from '../combat/selectors';
import { selectHasFlag } from '../flags/selectors';
import { selectLocationChain } from '../locations/selectors';
import { selectFacts } from '../memory/selectors';
import { selectNpcs } from '../npcs/selectors';
import { selectThreads } from '../threads/selectors';
import { escapeRating, escapeSkill, fightSecurity, type Captivity } from './captivity';
import { heatNow, pendingFor, runnerFor, stabilizesCaptives, standingBlockades, type BlockadesState } from './blockades';
import { timelineHandoff, untoldIds, type Handoff } from './handoff';
import { actionMatters, controlNow, openNetwork, outcomeState, type ControlNow, type WorldAction, type WorldFacts } from './network';
import type { NetworkState, Substitute, WorldEvent } from './world';

export { handoffLines } from './handoff';

export const selectWorldLog = (s: GameState): readonly WorldEvent[] => s.world.log;
/** World events the story has not told yet (they go into the next narration). */
export const selectUntoldWorldEvents = (s: GameState): WorldEvent[] => s.world.log.filter((e) => e.narratedTurn === null);

// ---- The tag network (D-466). `net` is the shipped network everywhere in the game; tests pass a fixture. ----

const nowBby = (s: GameState): number => -dateFromAbsDay(s.clock.now.day).year;

/** The network state with everything before the campaign (or before this data existed) standing as recorded. */
export const selectNetworkState = (s: GameState, net: WorldNetwork = WORLD_NETWORK): NetworkState => openNetwork(net, s.world.network, s.clock.now.day);

/**
 * A canon figure as this campaign has it (D-467): without the death on record while the event that causes it has not come
 * about (it diverged, or it is late). Any other death stands on its date.
 */
export function selectCanonInCampaign(s: GameState, n: CanonNpc, net: WorldNetwork = WORLD_NETWORK): CanonNpc {
  const link = CANON_DEATH_LINKS[n.canonId];
  if (!link || n.deathBby === undefined) return n;
  const state = outcomeState(net, selectNetworkState(s, net), link);
  return state === 'broken' || state === 'pending' ? withoutDeath(n) : n;
}

const placeNames = (s: GameState, locationId: string | null): string[] => selectLocationChain(s, locationId).flatMap((l) => [l.name, ...l.aliases]);

/** Who could stand in for a lost role: canon figures in office first (same title, then nearest in age), then known NPCs. */
function standIns(s: GameState, role: RoleTag, exclude: ReadonlySet<string>, lost: ReadonlyMap<string, unknown>): Omit<Substitute, 'role'>[] {
  const bby = nowBby(s);
  const gone = role.canonId ? CANON_BY_ID.get(role.canonId) : undefined;
  const faction = role.faction ?? (gone ? canonFactionAt(gone, bby) : undefined);
  const roles = role.roles ?? (gone ? [canonRoleAt(gone, bby)] : undefined);
  if (!faction || !roles) return [];
  const title = gone ? canonRankAt(gone, bby)?.title : undefined;
  const born = gone?.birthBby ?? null;
  const seen = new Set<string>();
  const canon = canonPresentAt(bby, CANON_NPCS.map((n) => selectCanonInCampaign(s, n)))
    .filter((n) => {
      if (seen.has(n.canonId) || exclude.has(n.canonId) || lost.has(n.canonId) || n.canonId === role.canonId) return false;
      seen.add(n.canonId);
      return canonFactionAt(n, bby) === faction && roles.includes(canonRoleAt(n, bby));
    })
    .map((n) => ({ n, sameTitle: title !== undefined && canonRankAt(n, bby)?.title === title, gap: born === null ? 0 : Math.abs(n.birthBby - born) }))
    .sort((a, b) => Number(b.sameTitle) - Number(a.sameTitle) || a.gap - b.gap || a.n.canonId.localeCompare(b.n.canonId))
    .map(({ n }) => ({ canonId: n.canonId, npcId: null, name: n.name }));
  const known = selectNpcs(s)
    .filter((n) => n.canonId === null && n.status === 'active' && n.factionId === faction && roles.includes(n.role) && !exclude.has(n.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((n) => ({ canonId: null, npcId: n.id, name: n.name }));
  return [...canon, ...known];
}

/** The people the player beat in the last fight, when it was a real fight and it was won. */
function wonFight(s: GameState): WorldFacts['wonFight'] {
  const last = selectLastFight(s);
  // Only a fight just fought: an old one must not count when a condition opens years later.
  if (!last || last.outcome !== 'won' || last.stakes === 'spar' || s.clock.now.day - last.day > 1) return null;
  const duel = last.duel as { opponents?: { id: string; engagedElsewhere?: boolean; out?: unknown }[] } | undefined;
  // An opponent an ally fought the whole time is not the player's (D-212).
  const foes = (duel?.opponents ?? []).filter((o) => !(o.engagedElsewhere && !o.out)).flatMap((o) => (s.npcs.byId[o.id] ? [s.npcs.byId[o.id]!] : []));
  return {
    id: last.id,
    stakes: last.stakes,
    canonIds: foes.flatMap((n) => (n.canonId ? [n.canonId] : [])),
    factions: foes.map((n) => n.factionId),
    places: placeNames(s, last.locationId ?? null),
  };
}

// A lead (D-468): a figure met, a site visited, or a fact or thread about one of the lead's places.
const significant = (t: string): string[] => [...new Set(normalizeText(t).split(/[^a-z0-9']+/).filter((w) => w.length > 3))];

/** Whether a text states what is to come outright: most of the significant words of one of the secrets (D-470 [4]). */
export function statesSecret(text: string, secrets: readonly string[]): boolean {
  const said = new Set(significant(text));
  return secrets.some((x) => {
    const words = significant(x);
    return words.length > 1 && words.filter((w) => said.has(w)).length / words.length >= SECRET_OVERLAP;
  });
}

/** A lead on record, learned in a scene (backstory is not): it points to a place or a person, and never states the secret. */
function leadOnRecord(s: GameState, l: Lead, secrets: readonly string[]): boolean {
  const people = selectNpcs(s).filter((n) => n.canonId !== null && (l.canonIds ?? []).includes(n.canonId));
  if (people.length) return true;
  const visited = Object.values(s.locations.byId);
  if ((l.sites ?? []).some((site) => visited.some((x) => x.firstVisitDay !== null && placeAmong(site, [], [x.name, ...x.aliases])))) return true;
  if (!l.places?.length) return false;
  const here = new Set(visited.filter((x) => l.places!.some((p) => placeAmong(p, [], [x.name, ...x.aliases]))).map((x) => x.id));
  // A start option's threads are backstory until play takes them up (D-470 [4]).
  const threads = selectThreads(s).filter((t) => t.lastTurn > 1 && t.entityRefs.some((r) => here.has(r)) && !statesSecret(`${t.title} ${t.stakes}`, secrets));
  return threads.length > 0 || selectFacts(s).some((x) => x.turn > 0 && here.has(x.aboutRef) && !statesSecret(x.text, secrets));
}

/** What the engine has recorded, for the network's tests. */
export function selectWorldFacts(s: GameState): WorldFacts {
  const lost = new Map<string, 'dead' | 'captured'>();
  for (const n of selectNpcs(s)) {
    if (!n.canonId) continue;
    if (n.status === 'deceased') lost.set(n.canonId, 'dead');
    // A capture counts only when the engine recorded it: the narrator's own report never breaks a tag (D-466).
    else if (n.canonDiverged?.reason === 'captured' && n.canonDiverged.recordedBy === 'engine') lost.set(n.canonId, 'captured');
  }
  return {
    bby: nowBby(s),
    npcLost: (id) => lost.get(id) ?? null,
    storyNpcDead: (name) => selectNpcs(s).some((n) => n.status === 'deceased' && [n.name, ...n.aliases].some((x) => normalizeText(x) === normalizeText(name))),
    hasFlag: (f) => selectHasFlag(s, f),
    hasLead: (l, secrets) => leadOnRecord(s, l, secrets),
    wonFight: wonFight(s),
    standIns: (role, exclude) => standIns(s, role, exclude, lost),
  };
}

/** A rolled check as the network sees it: the scene's places, and the places and canon figures it targets. */
export function selectWorldAction(s: GameState, check: { actionType: WorldAction['actionType']; skillId: string | null; total: number; targets: readonly string[] }): WorldAction {
  const targetPlaces = check.targets.filter((t) => s.locations.byId[t]);
  return {
    actionType: check.actionType,
    skillId: check.skillId,
    total: check.total,
    places: [s.locations.currentId, ...targetPlaces].flatMap((id) => placeNames(s, id)),
    canonIds: check.targets.flatMap((t) => s.npcs.byId[t]?.canonId ?? []),
  };
}

/** Whether an open condition of the network is about this action (otherwise nothing is recorded). */
export const selectActionMatters = (s: GameState, a: WorldAction, net: WorldNetwork = WORLD_NETWORK): boolean =>
  net.events.length > 0 && actionMatters(net, selectNetworkState(s, net), selectWorldFacts(s), a);

/** Who controls these places now: the dated table, the freeze, and what this campaign changed. */
export const selectControl = (s: GameState, names: readonly string[], net: WorldNetwork = WORLD_NETWORK): ControlNow[] =>
  controlNow(net, selectNetworkState(s, net), nowBby(s), (place, aliases) => placeAmong(place, aliases, names));

export interface LeaderNow extends LeaderSpan {
  held: HeldReason | null;
}

/** Who leads the powers now, with the freeze. */
export function selectLeaders(s: GameState, net: WorldNetwork = WORLD_NETWORK, table: readonly LeaderSpan[] = FACTION_LEADERS): LeaderNow[] {
  const st = selectNetworkState(s, net);
  const bby = nowBby(s);
  const now = new Map<LeaderSpan, HeldReason | null>();
  for (const office of new Set(table.map((l) => l.office))) {
    const spans = table.filter((l) => l.office === office);
    for (const f of datedFactsAt(spans, bby, (o) => outcomeState(net, st, o))) now.set(f.fact, f.held);
  }
  return table.flatMap((l) => (now.has(l) ? [{ ...l, held: now.get(l)! }] : []));
}

/** The Jedi Order's seat now, with the freeze; null = none. */
export function selectOrderSeat(s: GameState, net: WorldNetwork = WORLD_NETWORK, table: readonly OrderSeat[] = ORDER_SEATS): string | null {
  const st = selectNetworkState(s, net);
  const facts = table.map((r) => ({
    fromBby: -r.fromYear,
    toBby: -r.toYear + 1,
    seat: r.seat,
    ...(r.dependsOn ? { dependsOn: r.dependsOn } : {}),
    ...(r.endsWith ? { endsWith: r.endsWith } : {}),
  }));
  return datedFactsAt(facts, nowBby(s), (o) => outcomeState(net, st, o))[0]?.fact.seat ?? null;
}

// ---- Blockades (D-469) ----

/** The blockades standing now: dated, and tied to their world events. */
export const selectStandingBlockades = (s: GameState): BlockadeDef[] => standingBlockades(selectNetworkState(s), s.clock.now.day);
export const selectBlockadeRunner = (s: GameState, b: BlockadeDef): Runner => runnerFor(s, b);
export const selectBlockadeHeat = (s: GameState, id: string): number => heatNow(s.world.blockades, id, s.clock.now.day);
export const selectPendingBlockade = (s: GameState, id: string, to: string): BlockadesState['pending'] => pendingFor(s.world.blockades, id, to, selectTurnInPlay(s));
/** The character's own ship is held by blockaders, and their blockade still stands or has not given it back. */
export const selectShipImpounded = (s: GameState): BlockadesState['impounded'] => s.world.blockades.impounded;
export const selectCaptorsStabilize = (b: BlockadeDef): boolean => stabilizesCaptives(b);
/** Held prisoner (D-471): by a fight's winners or a blockade, until the engine ends it. */
export const selectCaptivity = (s: GameState): Captivity | null => s.world.captivity;
/** The security a fight's captors keep (the combat feature records it at the capture). */
export const selectFightSecurity = (standing: number, named: boolean): number => fightSecurity(standing, named);
/** An escape the player could try now: the rating to beat and the skill it would use; null when there is none to try. */
export function selectEscape(s: GameState, named?: string): { rating: number; skillId: string } | null {
  const c = s.world.captivity;
  if (!c || s.combat.active || s.clock.now.day < c.nextTryDay) return null;
  return { rating: escapeRating(c), skillId: escapeSkill(s, named) };
}
export const selectCaptivityNews = (s: GameState): string[] => (s.world.captivityNews && s.world.captivityNews.toldTurn === null ? [`Captivity (decided by the engine; narrate it exactly): ${s.world.captivityNews.text}.`] : []);

/** What code decided about the timeline, for the narrator: news not told yet, and the divergences that stand. */
export const selectTimelineHandoff = (s: GameState, net: WorldNetwork = WORLD_NETWORK): Handoff => timelineHandoff(net, selectNetworkState(s, net), placeNames(s, s.locations.currentId));

/** Everything the narration being written is given to tell, marked told once it commits (D-136, D-466). */
export const selectWorldIdsToTell = (s: GameState, net: WorldNetwork = WORLD_NETWORK): string[] => [...selectUntoldWorldEvents(s).map((e) => e.id), ...untoldIds(net, selectNetworkState(s, net)), ...(selectCaptivityNews(s).length ? ['captivity'] : [])];
