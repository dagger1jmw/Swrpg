// The game's situations for the narrative schema's parts (m8-ground Part A, D-520): each a real state built through events, with
// the player's words where the situation is spoken. Used by tests/ai/schemaParts.test.ts (sizes, no event lost).
import { absDayFromDate } from '../../src/engine/calendar';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { NarrativeTurnInfo } from '../../src/state/types';

const START = absDayFromDate({ year: -3661, month: 3, day: 1 });

export interface Situation {
  name: string;
  state: GameState;
  turn: NarrativeTurnInfo;
}

const ev = (s: GameState, events: unknown[], source: 'ai' | 'engine' | 'player' | 'dev' = 'ai'): GameState => {
  const r = applyEvents(REGISTRY, s, events, { source });
  return r.state;
};

export function base(o: { path?: 'jedi' | 'career' | 'sith'; rank?: string; archetype?: string; army?: boolean } = {}): GameState {
  let s = createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'parts',
    start: { day: START, second: 9 * 3600 },
    character: {
      name: 'Kael',
      birthDay: START - 30 * 368,
      path: o.path ?? 'jedi',
      archetype: o.archetype ?? (o.path === 'career' ? 'officer' : 'jediGuardian'),
      ...(o.path === 'career' ? {} : { mainFormId: 'soresu', trainingStartAge: 4 }),
    },
    rank: o.rank ?? (o.path === 'career' ? 'career' : 'knight'),
  });
  if (o.army) s = { ...s, ranks: { ...s.ranks, service: { ladderId: 'republicArmy', rung: 1, since: START, deeds: 0 } } };
  return ev(s, [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: '', moveHere: true }]);
}

export const at = (s: GameState, name: string, kind: string): GameState => ev(s, [{ type: 'locationIntroduced', name, kind, region: 'Coruscant', parentRef: s.locations.currentId ?? undefined, description: '', moveHere: true }]);

/** Introduce people and put them in the scene. */
export function meet(s0: GameState, people: { name: string; role: string; faction: string; canon?: boolean }[]): GameState {
  let s = s0;
  const ids: string[] = [];
  for (const p of people) {
    s = ev(s, [{ type: 'npcIntroduced', name: p.name, species: 'human', faction: p.faction, role: p.role, description: '' }]);
    const id = Object.values(s.npcs.byId).find((n) => n.name === p.name)!.id;
    if (p.canon) s = { ...s, npcs: { ...s.npcs, byId: { ...s.npcs.byId, [id]: { ...s.npcs.byId[id]!, canonId: `lore:${id}` } } } };
    ids.push(id);
  }
  return { ...s, pacing: { ...s.pacing, scene: { ...s.pacing.scene, presentNpcIds: [...s.pacing.scene.presentNpcIds, ...ids] } } };
}

export const threads = (s: GameState): GameState => ev(s, [{ type: 'threadOpened', title: 'The missing holocron', stakes: 'trust', entityRefs: [] }]);
export const traitsLive = (s: GameState): GameState => ({ ...s, traits: { ...s.traits, quiz: { ...s.traits.quiz, status: 'taken' } } }) as GameState;
export const beatPending = (s: GameState): GameState => ({ ...s, progression: { ...s.progression, tierBeatsPending: [{ id: 'beat1', skillId: 'soresu', tier: 'adept', day: START } as never] } });
export const masterHere = (s0: GameState): GameState => {
  const s = meet(s0, [{ name: 'Master Orren Vash', role: 'jediMaster', faction: 'jediOrder' }]);
  return { ...s, ranks: { ...s.ranks, masterId: Object.values(s.npcs.byId).find((n) => n.name === 'Master Orren Vash')!.id } };
};
export const ownShip = (s: GameState): GameState => ev(s, [{ type: 'shipAct', what: 'ship: salvaged a Dynamic-class freighter' }], 'engine');

const turn = (text = '', over: Partial<NarrativeTurnInfo> = {}): NarrativeTurnInfo => ({ timeAdvancedByDraft: false, text, ...over });

/** Every situation the tests measure (sizes) and compare (no event lost). */
export function situations(): Situation[] {
  const knight = base();
  const rich = traitsLive(beatPending(threads(knight)));
  const fightPending = ev(meet(rich, [{ name: 'Darth Vek', role: 'sithLord', faction: 'sithEmpire' }]), [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'sithTrooper', count: 3 }], stakes: 'lethal', terrainTags: [] }]);
  const shipBattle = ev(ownShip(rich), [{ type: 'combatStarted', opponentRefs: [], stakes: 'lethal', terrainTags: [], ships: 'enemy: two Imperial Supremacy fighters' }]);
  // The largest the parts can add up to: a canon figure, a merchant and the master at a market, the words naming buying and training.
  const worst = meet(masterHere(at(rich, 'the market', 'district')), [
    { name: 'Dela Voss', role: 'merchant', faction: 'civilian' },
    { name: 'Satele Shan', role: 'jediMaster', faction: 'jediOrder', canon: true },
  ]);
  const planning = ev(meet(rich, [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]), [{ type: 'groundBattlePlanned', site: 'the Aldera plains', enemy: 'four Sith infantry, armour' }]);
  const groundBattle = ev(planning, [{ type: 'groundBattleBegun' }], 'player');
  const everything = ownShip(
    meet(masterHere(at(rich, 'the Temple hangar spaceport', 'building')), [
      { name: 'Major Tarsk', role: 'officer', faction: 'republic' },
      { name: 'Dela Voss', role: 'merchant', faction: 'civilian' },
      { name: 'Satele Shan', role: 'jediMaster', faction: 'jediOrder', canon: true },
    ]),
  );
  return [
    { name: 'alone in the wilds', state: at(knight, 'the Dune Sea', 'wilderness'), turn: turn('I walk on') },
    { name: 'a full story, alone', state: rich, turn: turn('I think it over') },
    { name: 'a conversation', state: meet(rich, [{ name: 'Old Hela', role: 'civilian', faction: 'civilian' }]), turn: turn('I ask her about the war') },
    { name: 'the Temple with the master', state: masterHere(at(rich, 'the Jedi Temple', 'building')), turn: turn('I bow to my master') },
    { name: 'a train turn', state: rich, turn: turn('I drill Soresu', { intentAction: 'train' }) },
    { name: 'a cantina deal', state: meet(at(rich, 'a cantina', 'building'), [{ name: 'Dela Voss', role: 'merchant', faction: 'civilian' }]), turn: turn('I offer her 200 credits') },
    { name: 'buying alone', state: rich, turn: turn('I buy a medpac') },
    { name: 'the spaceport with the ship', state: ownShip(at(rich, 'the spaceport', 'district')), turn: turn('I check the hyperdrive') },
    { name: 'aboard a ship', state: at(rich, 'the freighter Dawn', 'ship'), turn: turn('I sit in the cockpit') },
    { name: 'a briefing', state: meet(rich, [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]), turn: turn('What is the plan for the assault?') },
    { name: 'an army officer', state: base({ path: 'career', army: true }), turn: turn('I report for duty') },
    { name: 'a canon figure', state: meet(rich, [{ name: 'Satele Shan', role: 'jediMaster', faction: 'jediOrder', canon: true }]), turn: turn('I greet her') },
    { name: 'a fight about to start', state: fightPending, turn: turn('I draw my lightsaber') },
    { name: 'a ship battle', state: shipBattle, turn: turn('Break left') },
    { name: 'a ground planning scene', state: planning, turn: turn('We take the ridge') },
    { name: 'a ground battle', state: groundBattle, turn: turn('Hold the line') },
    { name: 'the largest combination', state: worst, turn: turn('I buy her a gift and then train with my master', { intentAction: 'train' }) },
    { name: 'everything at once', state: everything, turn: turn('I buy fuel for my ship, train with my master in tactics and plan the battle', { intentAction: 'train' }) },
    // m8-fixes A2: the capture fields' cues (a bounty hunter here; the player's own words).
    { name: 'a bounty hunter here', state: meet(rich, [{ name: 'Vorn Kast', role: 'bountyHunter', faction: 'underworld' }]), turn: turn('I keep my hand near my saber') },
    { name: 'the player speaks of capture', state: rich, turn: turn('I want him taken alive') },
  ];
}
