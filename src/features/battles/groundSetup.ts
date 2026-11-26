// A ground battle's planning scene from the narrator's words and the state (m8-ground, D-522; spec/ground-command.md section 2).
// The narrator opens the scene (a command centre, a briefing, a council in the field) with the forces in plain words; the code
// reads them, decides who plans by rank (or the story's hand-over), draws the map (a known site's lore features, else the
// narrator's, tagged invented), and has the enemy commander pick a plan and deploy. Pure; reads the state through selectors.
import { GENERIC_CREW } from '../../data/shipBattles.config';
import { GROUND_COMMAND_BASICS, GROUND_LIMITS, TACTIC_PLAN, WEATHER, type Weather } from '../../data/groundCommand.config';
import { SERVICE_LADDER_BY_ID } from '../../data/serviceRanks';
import { tacticsOfSets } from '../../data/tactics';
import { unitDef } from '../../engine/groundBattle';
import { seedRng } from '../../engine/rng';
import { FORM_IDS } from '../../data/skills';
import type { GameState } from '../../state/gameState';
import { selectCharacter } from '../character/selectors';
import { selectCurrentLocation } from '../locations/selectors';
import { selectNpc, selectNpcLevel, selectNpcs } from '../npcs/selectors';
import { uniqueAliasMatch } from '../../engine/aliases';
import { selectPresentNpcIds } from '../pacing/selectors';
import { selectLevelExact, selectPerformance } from '../progression/selectors';
import { selectKnownTactics } from '../tactics/selectors';
import { selectDuelTier } from '../world/selectors';
import { buildMap, defaultPlan, deployEnemy, enemyPlan, gridSize, unitsFromWords, type GLeader, type GroundPlanning, type GroundRole, type GSide } from './ground';
import { opposite, playerFaction, troopsFor, yearOf } from './setup';

export interface GroundProposal {
  site: string;
  enemy: string;
  ours?: string;
  enemyFaction?: string;
  defending?: boolean;
  terrain?: string;
  weather?: Weather;
  commandHanded?: string;
  commanderRef?: string;
  meditatorRef?: string;
  enemyMeditatorRef?: string;
  jammed?: boolean;
}

/** The faction plain enemy words name, where they name one (else the player's enemy). */
const ENEMY_SIDE_WORDS: readonly (readonly [RegExp, string])[] = [
  [/\bmandalorians?\b/i, 'mandalorians'],
  [/\bpirates?\b|\bgangs?\b|\bcartels?\b|\bhutts?\b|\bthugs?\b|\bmercenar(?:y|ies)\b/i, 'underworld'],
  [/\bseparatists?\b|\bconfederacy\b|\bcis\b|\bnationalists?\b|\binsurgents?\b|\brebels?\b|\bmilitia\b/i, 'independent'],
  [/\bsith\b|\bimperials?\b|\bempire\b|\bstormtroopers?\b/i, 'sithEmpire'],
  [/\brepublic\b|\bclones?\b|\bjedi\b/i, 'republic'],
];

/**
 * The narrator's plain words to a proposal (m8-ground, D-520: one details line keeps the schema small, as combatStarted's ships):
 * "defending; terrain: a ridge, a river with a bridge; weather: fog; commander: Major Tarsk; meditator: Bastila Shan; enemy
 * meditator: Kaan; command: the general is dead; jammed". People are matched by their exact names among the NPCs met.
 */
export function proposalFromWords(s: GameState, site: string, enemy: string, ours: string | undefined, details: string): GroundProposal {
  const parts = details.split(';').map((x) => x.trim()).filter(Boolean);
  const value = (key: RegExp): string | undefined => parts.map((x) => key.exec(x)).find((m) => m)?.[1]?.trim();
  const npc = (name: string | undefined): string | undefined => (name ? uniqueAliasMatch(selectNpcs(s), (n) => [n.name, ...n.aliases], name)?.id : undefined);
  const weather = value(/^weather\s*:\s*(\w+)/i)?.toLowerCase();
  const side = ENEMY_SIDE_WORDS.find(([re]) => re.test(enemy))?.[1];
  const mine = playerFaction(s);
  const terrain = value(/^terrain\s*:\s*(.+)$/i);
  const commandHanded = value(/^command\s*:\s*(.+)$/i);
  const commanderRef = npc(value(/^commander\s*:\s*(.+)$/i));
  const meditatorRef = npc(value(/^meditator\s*:\s*(.+)$/i));
  const enemyMeditatorRef = npc(value(/^enemy meditator\s*:\s*(.+)$/i));
  return {
    site,
    enemy,
    ...(ours ? { ours } : {}),
    ...(side && side !== mine && !(side === 'republic' && mine === 'jediOrder') && !(side === 'sithEmpire' && mine === 'sith') ? { enemyFaction: side } : {}),
    ...(parts.some((x) => /^(?:defending|we hold|holding)\b/i.test(x)) ? { defending: true } : {}),
    ...(terrain ? { terrain } : {}),
    ...(weather && weather in WEATHER ? { weather: weather as Weather } : {}),
    ...(commandHanded ? { commandHanded } : {}),
    ...(commanderRef ? { commanderRef } : {}),
    ...(meditatorRef ? { meditatorRef } : {}),
    ...(enemyMeditatorRef ? { enemyMeditatorRef } : {}),
    ...(parts.some((x) => /^jammed\b/i.test(x)) ? { jammed: true } : {}),
  };
}

const FORCE_FACTIONS = new Set(['jediOrder', 'sith']);
const FORCE_ROLES = new Set(['jediMaster', 'jediKnight', 'padawan', 'sithLord', 'sithAcolyte', 'darkJedi', 'darkAcolyte', 'inquisitor']);

export { playerMayPlanGround } from './selectors';
import { playerMayPlanGround } from './selectors';

/** Jedi and Sith fight at the front; so does anyone without a rank. */
const forceUser = (s: GameState): boolean => s.character.path === 'jedi' || s.character.path === 'sith';

/** The commander's default place (Jared): the officer archetype and senior army officers at the post; Jedi and Sith at the front. */
function defaultAtPost(s: GameState): boolean {
  if (forceUser(s)) return false;
  if (selectCharacter(s).archetype === 'officer') return true;
  const svc = s.ranks.service;
  return !!svc && SERVICE_LADDER_BY_ID.get(svc.ladderId)?.branch === 'army' && svc.rung >= 3;
}

/** An NPC as a sector leader: their Tactics, whether they are a Force user (morale at the front), a duelist's tier (a reading). */
function leaderOf(s: GameState, id: string): GLeader | null {
  const n = selectNpc(s, id);
  if (!n || n.status === 'deceased') return null;
  const fu = FORCE_FACTIONS.has(n.factionId) || FORCE_ROLES.has(n.role);
  return { name: n.name, npcId: n.id, tactics: selectNpcLevel(s, n.id, 'tactics'), forceUser: fu, tier: n.role === 'jediMaster' || n.role === 'sithLord' ? 'master' : 'below' };
}

/** The ground manoeuvres the character knows, with what any commander can order (data/groundCommand.config.ts). */
export function knownGround(s: GameState, commanding: boolean): string[] {
  const known = [...selectKnownTactics(s)].filter((t) => TACTIC_PLAN[t]);
  return [...new Set([...known, ...(commanding ? GROUND_COMMAND_BASICS : [])])];
}

/** What an NPC side's commanders know by its kind (readings, invented): armies the officer's set, irregulars their own fighting. */
export function enemyGroundKnowledge(kind: string): string[] {
  const sets = kind === 'navy' || kind === 'elite' ? ['groundOfficer'] : kind === 'droid' ? ['groundBasics'] : ['irregularGround', 'groundBasics'];
  return tacticsOfSets(sets, GROUND_COMMAND_BASICS).filter((t) => TACTIC_PLAN[t]);
}

const KIND_OF_FACTION: Readonly<Record<string, string>> = { underworld: 'pirate', civilian: 'militia', independent: 'navy', mandalorians: 'elite' };

/** A planning scene checked and built, or why not. */
export function planningFromProposal(s: GameState, p: GroundProposal, id: string): { planning: GroundPlanning } | { reject: string } {
  const year = yearOf(s);
  const mine = playerFaction(s);
  const enemyFaction = p.enemyFaction ?? opposite(mine);
  const enemyKind = KIND_OF_FACTION[enemyFaction] ?? 'navy';
  const may = playerMayPlanGround(s) || !!p.commandHanded;
  const role: GroundRole = may ? 'commander' : forceUser(s) || s.ranks.service ? 'leader' : 'soldier';
  const enemyRead = unitsFromWords(p.enemy, troopsFor(enemyFaction, year), 'e');
  if (enemyRead.errors.length && !enemyRead.units.length) return { reject: enemyRead.errors.join('; ') };
  if (!enemyRead.units.length) return { reject: `no enemy unit could be read from "${p.enemy}"` };
  const oursRead = p.ours ? unitsFromWords(p.ours, troopsFor(mine, year), 'u') : unitsFromWords(`${role === 'commander' ? 4 : 3} troops`, troopsFor(mine, year), 'u');
  if (!oursRead.units.length) return { reject: oursRead.errors.join('; ') || 'no unit of ours could be read' };
  const rng0 = seedRng(`${s.meta.campaignId}:${id}:${s.meta.turn}`);
  const defending = p.defending === true;
  const size = gridSize(oursRead.units.length, enemyRead.units.length);
  const { map, rng: r1 } = buildMap({ site: p.site, year, terrain: p.terrain ?? null, size, positions: Math.ceil(Math.max(oursRead.units.length, enemyRead.units.length) / 3), defending, rng: rng0 });
  const enemyKnows = enemyGroundKnowledge(enemyKind);
  const [ePlan, r2] = enemyPlan(!defending, enemyKnows, r1);
  const [deploy] = deployEnemy(enemyRead.units, map, ePlan, !defending, r2);
  const present = selectPresentNpcIds(s);
  const leaders = present.map((x) => leaderOf(s, x)).filter((x): x is GLeader => x !== null);
  const cmdNpc = p.commanderRef ? selectNpc(s, p.commanderRef) : null;
  const medNpc = p.meditatorRef ? leaderOf(s, p.meditatorRef) : null;
  const medLevel = (npcId: string): number => selectNpcLevel(s, npcId, 'meditation');
  const canMeditate = selectLevelExact(s, 'battleMeditation') > 0;
  const irregular = (units: readonly { unit: string }[]): boolean => units.every((u) => ['militia', 'warBeasts'].includes(u.unit));
  const ours: GSide = {
    name: mine === 'jediOrder' ? 'the Republic and the Order' : mine === 'republic' ? 'the Republic' : mine === 'sithEmpire' || mine === 'sith' ? 'the Empire' : 'our side',
    faction: mine,
    units: oursRead.units,
    commander: may ? { name: selectCharacter(s).name, npcId: null, tactics: selectPerformance(s, 'tactics') } : { name: cmdNpc?.name ?? 'the commanding officer', npcId: cmdNpc?.id ?? null, tactics: cmdNpc ? Math.max(GENERIC_CREW['navy']!, selectNpcLevel(s, cmdNpc.id, 'tactics')) : GENERIC_CREW['navy']! },
    meditation: medNpc ? { name: medNpc.name, level: medLevel(medNpc.npcId!), npcId: medNpc.npcId, player: false } : null,
    officers: !irregular(oursRead.units),
  };
  const enemyMed = p.enemyMeditatorRef ? leaderOf(s, p.enemyMeditatorRef) : null;
  const enemy: GroundPlanning['enemy'] = {
    name: enemyFaction === 'sithEmpire' || enemyFaction === 'sith' ? 'the Empire' : enemyFaction === 'republic' || enemyFaction === 'jediOrder' ? 'the Republic' : `the ${enemyFaction}`,
    faction: enemyFaction,
    units: enemyRead.units,
    commander: { name: 'the enemy commander', npcId: null, tactics: GENERIC_CREW[enemyKind] ?? GENERIC_CREW['navy']! },
    meditation: enemyMed ? { name: enemyMed.name, level: medLevel(enemyMed.npcId!), npcId: enemyMed.npcId, player: false } : null,
    officers: !irregular(enemyRead.units),
    plan: ePlan,
    deploy,
  };
  const weather: Weather = p.weather && p.weather in WEATHER ? p.weather : 'clear';
  const known = knownGround(s, role === 'commander');
  // A leader or a soldier fights under the NPC commander's plan: the plan is made from what an army's officers know.
  const planKnows = role === 'commander' ? known : enemyGroundKnowledge('navy');
  const atPost = role === 'commander' ? defaultAtPost(s) : false;
  const loc = selectCurrentLocation(s);
  const me = {
    name: selectCharacter(s).name,
    npcId: null,
    tactics: selectPerformance(s, 'tactics'),
    forceUser: forceUser(s),
    tier: selectDuelTier(s),
    meditation: selectLevelExact(s, 'meditation'),
    canMeditate,
  };
  const base = { map, ours, known: planKnows, defending, role, atPost, weather };
  // A leader or a soldier fights under the NPC commander's plan; a commander starts from a suggestion and changes it.
  const plan = defaultPlan(base, role !== 'soldier' && !atPost);
  return {
    planning: {
      id,
      site: p.site.slice(0, 60),
      placeId: loc?.id ?? null,
      year,
      day: s.clock.now.day,
      weather,
      defending,
      role,
      atPost,
      handed: p.commandHanded?.slice(0, 120) ?? null,
      jammed: p.jammed === true,
      map,
      ours,
      enemy,
      plan,
      scouting: { tries: 0, planKnown: false, noticed: false, log: [] },
      leaders,
      me,
      known,
      planKnows,
      enemyKnows,
    },
  };
}

/** The level a scouting try rolls with: the player's Stealth for recon, Intelligence for a read of the enemy. */
export const scoutLevel = (s: GameState, how: 'recon' | 'intelligence'): number => selectPerformance(s, how === 'recon' ? 'stealth' : 'intelligence');

/** The better of the player's combat levels (their own fight at the front). */
export const playerCombat = (s: GameState): number => Math.max(selectPerformance(s, 'blaster'), selectPerformance(s, 'melee'), ...FORM_IDS.map((f) => selectPerformance(s, f)));

/** Units a side could field, for the dev command and tests. */
export const unitCount = (units: readonly { unit: string }[], type: string): number => units.filter((u) => unitDef(u.unit).type === type).length;

export const MAX_UNITS = GROUND_LIMITS.unitsPerSide;
