// Non-Force skills (M8 checklist items 10 and 12; docs-v2/spec/skills-m8.md section 11): Gunnery and Repair, XP from play,
// the new activities, melee styles and Teräs Käsi, training programmes, the archetypes and the rank ladders.
import { describe, expect, it } from 'vitest';
import { ACTIVITY_BY_ID, DEFAULT_ACTIVITY } from '../../src/data/activities';
import { ARCHETYPE_BY_ID, PATH_ARCHETYPES } from '../../src/data/archetypes';
import { MARTIAL_STYLES, STYLE, STYLE_BY_ID, TERAS_KASI, styleExists } from '../../src/data/martialStyles';
import { ORDER_REQUIREMENTS } from '../../src/data/orderRequirements';
import { SERVICE_LADDERS, SERVICE_LADDER_BY_ID } from '../../src/data/serviceRanks';
import { COMMAND, CULTURAL_INSIGHT, FIELD_TACTICS_INTELLIGENCE, PERSUASION } from '../../src/data/skillXp.config';
import { SKILL_BY_ID } from '../../src/data/skills';
import { PROGRAMME_BY_ID, TRAINING_PROGRAMMES, programmeYears } from '../../src/data/trainingProgrammes';
import { absDayFromDate, DAYS_PER_YEAR } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { duelTier, canBeat } from '../../src/engine/who';
import { commandMods, type FleetSide } from '../../src/engine/fleetBattle';
import {
  fightStyle,
  forceSensePrecog,
  precogDefence,
  stackedSkill,
  styleAccess,
  styleBonus,
  styleGain,
  styleLearnMult,
  styleNow,
  terasKasiAnticipation,
  terasKasiSpeed,
  terasKasiStrike,
} from '../../src/engine/martialStyles';
import { commandXp, fieldOpXp, gunneryXp, insightBonus, persuasionXp, repairXp, socialFalloff, socialLineXp, strikeTacticsXp } from '../../src/engine/playXp';
import { programmeEndDay, programmeEntry, programmeShares } from '../../src/engine/programmes';
import { servicePromotionCheck } from '../../src/engine/serviceRanks';
import { crewFromLevels, gunnerLevel } from '../../src/engine/ships';
import { npcLevelsFor } from '../../src/features/npcs/selectors';
import { resolveTraining, type TrainingRequest } from '../../src/features/progression/training';
import { selectLevelExact, selectNatural, selectStyles } from '../../src/features/progression/selectors';
import { selectShipCrew } from '../../src/features/combat/selectors';
import { buildPlayerFighter } from '../../src/features/combat/build';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { GameEvent } from '../../src/state/types';

const day = (year: number, month = 3, d = 1): number => absDayFromDate({ year, month, day: d });

function fresh(o: { year?: number; archetype?: string; path?: string; species?: string; age?: number } = {}): GameState {
  const d = day(o.year ?? -3661);
  const s = createInitialState<GameState>(REGISTRY, {
    campaignId: 'skills',
    branchId: 'b',
    seed: 'skills',
    start: { day: d, second: 8 * 3600 },
    character: { name: 'Tal', birthDay: d - (o.age ?? 30) * 368, path: o.path ?? 'career', archetype: o.archetype ?? 'soldier', speciesId: o.species ?? 'human' } as never,
    rank: o.path === 'jedi' ? 'knight' : 'career',
  } as never);
  return { ...s, economy: { ...s.economy, wallet: { republic: 100_000, imperial: 0, hutt: 0 } } };
}
/** The character at an exact level in a skill (trained XP above the natural baseline). */
function withLevel(s: GameState, id: string, level: number): GameState {
  const xp = Math.max(0, xpForLevel(level) - xpForLevel(selectNatural(s, id)));
  return { ...s, progression: { ...s.progression, skills: { ...s.progression.skills, [id]: { xp, rust: 0, lastPracticedDay: s.clock.now.day } } } };
}
const engine = (s: GameState, events: object[]) => applyEvents(REGISTRY, s, events as GameEvent[], { source: 'engine' });
const player = (s: GameState, events: object[]) => applyEvents(REGISTRY, s, events as GameEvent[], { source: 'player' });
const xpOf = (s: GameState, id: string): number => s.progression.skills[id]?.xp ?? 0;
const train = (s: GameState, req: TrainingRequest) => {
  const p = resolveTraining(s, req);
  if (!p.ok) throw new Error(p.reason);
  return p;
};
const credited = (s: GameState, req: TrainingRequest): Record<string, number> => (train(s, req).events[0] as unknown as { credited: Record<string, number> }).credited;

describe('Gunnery and Repair (spec §2)', () => {
  it('two new skills, trained by their own activities with the ruled weights', () => {
    expect(SKILL_BY_ID.get('gunnery')?.category).toBe('technique');
    expect(SKILL_BY_ID.get('repair')?.category).toBe('technique');
    expect(ACTIVITY_BY_ID.get(DEFAULT_ACTIVITY['gunnery']!)?.secondaries).toEqual({ agility: 0.3, intelligence: 0.2 });
    expect(ACTIVITY_BY_ID.get(DEFAULT_ACTIVITY['repair']!)?.secondaries).toEqual({ intelligence: 0.3 });
  });
  it('a mounted weapon is fired with Gunnery, never Piloting or Blaster; Blaster stays personal arms', () => {
    const lv = { piloting: 70, blaster: 80, gunnery: 30, repair: 20, forceSense: 0 };
    expect(crewFromLevels(lv)).toEqual({ piloting: 70, gunnery: 30, repair: 20, forceSense: 0 });
    expect(gunnerLevel(lv)).toBe(30);
    const s = withLevel(withLevel(withLevel(fresh(), 'gunnery', 40), 'piloting', 60), 'blaster', 75);
    const crew = selectShipCrew(s);
    expect(crew.gunnery).toBeCloseTo(40, 0);
    expect(crew.piloting).toBeCloseTo(60, 0);
    // The personal fight still uses Blaster.
    expect(buildPlayerFighter(s).skillId).toBe('blaster');
  });
  it('Repair rolls droid jobs; the character\'s own work needs a tool kit, and parts are paid beyond a reboot', () => {
    let s = withLevel(fresh(), 'repair', 60);
    s = applyEvents(REGISTRY, s, [{ type: 'trade', dir: 'buy', item: 'a T7 astromech' }] as GameEvent[], { source: 'ai' }).state;
    const unit = s.droids.units[0]!;
    s = { ...s, droids: { ...s.droids, units: [{ ...unit, systems: { ...unit.systems, sensors: 'damaged' } }] } };
    const noKit = applyEvents(REGISTRY, s, [{ type: 'droid', what: `repaired ${unit.name}` }] as GameEvent[], { source: 'ai' });
    expect(noKit.applied.flatMap((a) => a.notes).join(' ')).toMatch(/tool kit/);
    // Buying a tool kit (200 cr, game stat) lets the character do it, rolled on Repair, parts paid, Repair XP earned.
    const kit = applyEvents(REGISTRY, s, [{ type: 'trade', dir: 'buy', item: 'a tool kit' }] as GameEvent[], { source: 'ai' }).state;
    expect(kit.droids.toolKit).toBe(true);
    const before = kit.economy.wallet.republic;
    const r = applyEvents(REGISTRY, kit, [{ type: 'droid', what: `repaired ${unit.name}` }] as GameEvent[], { source: 'ai' });
    const text = r.applied.flatMap((a) => a.notes).join(' ');
    expect(text).toMatch(/Repair/);
    expect(r.state.economy.wallet.republic).toBeLessThan(before);
    expect(xpOf(r.state, 'repair')).toBeGreaterThan(xpOf(kit, 'repair'));
  });
  it('soldier, naval officer and smuggler lines take Gunnery shares; pilots train it with Piloting', () => {
    for (const id of ['soldier', 'smuggler', 'navalOfficer', 'starfighterPilot']) expect(ARCHETYPE_BY_ID.get(id)!.weights['gunnery'] ?? 0, id).toBeGreaterThan(0);
    expect(ARCHETYPE_BY_ID.get('engineer')!.main).toBe('repair');
    expect(ARCHETYPE_BY_ID.get('shipGunner')!.main).toBe('gunnery');
  });
});

describe('XP from play (spec §3)', () => {
  it('Charisma comes from social lines, and later lines the same day earn less', () => {
    expect(socialFalloff(1)).toBe(1);
    expect(socialFalloff(2)).toBeLessThan(1);
    expect(socialFalloff(3)).toBeLessThan(socialFalloff(2));
    let s = fresh();
    const gains: number[] = [];
    for (let i = 0; i < 3; i++) {
      const before = xpOf(s, 'charisma');
      s = engine(s, [{ type: 'playXpEarned', source: 'socialLine', stakes: 'notable' }]).state;
      gains.push(xpOf(s, 'charisma') - before);
    }
    expect(gains[1]!).toBeLessThan(gains[0]!);
    expect(gains[2]!).toBeLessThan(gains[1]!);
    // A new day starts fresh.
    const next = advanceTime(REGISTRY, s, { seconds: 86_400, reason: 'a day', source: 'turnDraft' }).state;
    const b = xpOf(next, 'charisma');
    const fresh1 = engine(next, [{ type: 'playXpEarned', source: 'socialLine', stakes: 'notable' }]).state;
    expect(xpOf(fresh1, 'charisma') - b).toBeCloseTo(gains[0]!, 6);
  });
  it('a sociable adult reaches about 30-40 Charisma by 30 from social lines (Jared)', () => {
    // From 12 to 30: about three logged lines a day on 300 days a year, a notable one among two minor ones.
    let xp = 0;
    for (let y = 12; y < 30; y++) for (let d = 0; d < 300; d++) xp += socialLineXp('notable', 1).charisma! + socialLineXp('minor', 2).charisma! + socialLineXp('minor', 3).charisma!;
    const level = (xp / 11.64) ** (1 / 1.75);
    expect(level).toBeGreaterThan(30);
    expect(level).toBeLessThan(40);
  });
  it('persuasion pays 1.0 on success and 0.25 on failure, by stakes and the opponent\'s level', () => {
    expect(persuasionXp(false, 'notable', 0).charisma! / persuasionXp(true, 'notable', 0).charisma!).toBeCloseTo(PERSUASION.failure, 6);
    expect(persuasionXp(true, 'major', 0).charisma!).toBeGreaterThan(persuasionXp(true, 'minor', 0).charisma!);
    expect(persuasionXp(true, 'notable', -25).charisma!).toBeLessThan(persuasionXp(true, 'notable', 12).charisma!);
  });
  it('command: stakes x outcome x size of command, a loss at about half, Intelligence 0.2 of it', () => {
    const won = commandXp('serious', 'won', 'company');
    const lost = commandXp('serious', 'lost', 'company');
    expect(lost.tactics! / won.tactics!).toBeCloseTo(0.5, 6);
    expect(won.intelligence! / won.tactics!).toBeCloseTo(FIELD_TACTICS_INTELLIGENCE, 6);
    expect(commandXp('serious', 'won', 'army').tactics!).toBeGreaterThan(won.tactics!);
    expect(commandXp('lethal', 'won', 'company').tactics!).toBeGreaterThan(won.tactics!);
    // Through the game, with combat's daily cap before M.
    let s = fresh();
    for (let i = 0; i < 10; i++) s = engine(s, [{ type: 'playXpEarned', source: 'command', stakes: 'lethal', outcome: 'won', size: 'fleet' }]).state;
    expect(s.progression.playToday?.['command:tactics']).toBeCloseTo(COMMAND.dailyCap, 6);
  });
  it('each strike earned at +3 on the track gives a small Tactics share, with Intelligence 0.2', () => {
    const x = strikeTacticsXp(4, 'serious');
    expect(x.tactics!).toBeGreaterThan(0);
    expect(x.tactics!).toBeLessThan(1);
    expect(x.intelligence! / x.tactics!).toBeCloseTo(0.2, 6);
    expect(strikeTacticsXp(0, 'serious')).toEqual({});
  });
  it('discussing tactics: a master\'s full multiplier; a peer half the base rate', () => {
    const s = fresh({ archetype: 'officer' });
    const peer = train(s, { activityId: 'tacticsDiscussion', hours: 1, source: { kind: 'peers' } });
    const master = train(s, { activityId: 'tacticsDiscussion', hours: 1, source: { kind: 'master' } });
    const pc = (peer.events[0] as unknown as { credited: Record<string, number> }).credited['tactics']!;
    const mc = (master.events[0] as unknown as { credited: Record<string, number> }).credited['tactics']!;
    expect(pc / mc).toBeCloseTo((0.5 * peer.card.instruction.factor) / master.card.instruction.factor, 1);
    expect(peer.card.notes.join(' ')).toMatch(/with a peer/);
    expect(resolveTraining(s, { activityId: 'tacticsDiscussion', hours: 1, source: { kind: 'solo' } }).ok).toBe(false);
  });
  it('cultural insight only at Intelligence 80+: Tactics and +1 (at most +2) against that culture', () => {
    const low = withLevel(fresh(), 'intelligence', 70);
    expect(resolveTraining(low, { activityId: 'cultureStudy', hours: 2, culture: 'sithEmpire' }).ok).toBe(false);
    let s = withLevel(fresh(), 'intelligence', 85);
    const p = train(s, { activityId: 'cultureStudy', hours: 4, culture: 'sithEmpire' });
    s = engine(s, p.events).state;
    expect(s.progression.insight?.['sithEmpire']).toBe(4);
    expect(insightBonus(CULTURAL_INSIGHT.firstHours)).toBe(1);
    expect(insightBonus(CULTURAL_INSIGHT.secondHours)).toBe(2);
    expect(insightBonus(10_000)).toBe(CULTURAL_INSIGHT.max);
    const side = { reform: { rounds: 1, gaps: false }, intel: false, commandLost: 0, meditation: null, modifiers: [], insight: 5, formation: 'line', broken: false, ships: [], wings: [] } as unknown as FleetSide;
    expect(commandMods(side, side).find((m) => m.source === 'cultural insight')?.value).toBe(2);
  });
  it('gunnery from shots by margin and stakes; repair by job; field operations on the tradecraft split', () => {
    expect(gunneryXp([8], 'serious').gunnery!).toBeGreaterThan(gunneryXp([-10], 'serious').gunnery!);
    expect(gunneryXp([0], 'lethal').gunnery!).toBeGreaterThan(gunneryXp([0], 'skirmish').gunnery!);
    expect(repairXp({ hours: 2, rating: 45, level: 40, success: true, inFight: true }).repair!).toBeGreaterThan(repairXp({ hours: 2, rating: 45, level: 40, success: true, inFight: false }).repair!);
    expect(repairXp({ hours: 2, rating: 45, level: 40, success: false, inFight: false }).repair!).toBeLessThan(repairXp({ hours: 2, rating: 45, level: 40, success: true, inFight: false }).repair!);
    const op = fieldOpXp('serious', 'won');
    expect(op.investigation!).toBeGreaterThan(op.stealth!);
    expect(fieldOpXp('serious', 'lost').investigation! / op.investigation!).toBeCloseTo(0.5, 6);
  });
});

describe('new activities (spec §4)', () => {
  const s = fresh({ archetype: 'intelAnalyst' });
  const cases: [string, string, string[]][] = [
    ['staffWork', 'intelligence', ['tactics']],
    ['negotiation', 'charisma', ['intelligence']],
    ['hunting', 'stealth', ['tracking']],
    ['tradecraft', 'investigation', ['stealth', 'charisma']],
    ['gunneryRange', 'gunnery', ['agility', 'intelligence']],
    ['repairWork', 'repair', ['intelligence']],
  ];
  for (const [id, primary, secondaries] of cases)
    it(`${id} trains ${primary} and ${secondaries.join(', ')}`, () => {
      const c = credited(s, { activityId: id, hours: 2, source: { kind: 'peers' } });
      expect(c[primary]!).toBeGreaterThan(0);
      for (const k of secondaries) expect(c[k] ?? 0, k).toBeGreaterThan(0);
      expect(c[primary]!).toBeGreaterThan(Math.max(...secondaries.map((k) => c[k] ?? 0)));
    });
  it('staff work and tradecraft are for officers, staff postings and the intelligence services', () => {
    const civ = fresh({ archetype: 'civilian' });
    expect(resolveTraining(civ, { activityId: 'staffWork', hours: 1 }).ok).toBe(false);
    expect(resolveTraining(civ, { activityId: 'tradecraft', hours: 1 }).ok).toBe(false);
    expect(resolveTraining(fresh({ archetype: 'officer' }), { activityId: 'staffWork', hours: 1 }).ok).toBe(true);
    expect(resolveTraining(fresh({ archetype: 'officer' }), { activityId: 'tradecraft', hours: 1 }).ok).toBe(false);
  });
  it('the Padawan session and the Korriban warblade class carry a Melee weight', () => {
    expect(ACTIVITY_BY_ID.get('padawanTraining')!.secondaries['melee']).toBeGreaterThan(0);
    expect(ORDER_REQUIREMENTS['acolyte']![0]!.activityId).toBe('warbladeTraining');
    expect(ACTIVITY_BY_ID.get('warbladeTraining')!.secondaries['melee']).toBeGreaterThan(0);
  });
});

describe('melee styles (spec §5)', () => {
  it('every style is dated and tied to its culture; none costs nothing', () => {
    expect(MARTIAL_STYLES.length).toBeGreaterThan(15);
    for (const m of MARTIAL_STYLES) {
      expect(m.culture.length, m.id).toBeGreaterThan(3);
      expect(m.dated.length, m.id).toBeGreaterThan(3);
      expect(m.source, m.id).toMatch(/SW_Martial_Cultures/);
      expect(styleBonus(m, 0), m.id).toBe(0);
    }
    expect(styleExists(STYLE_BY_ID.get('ktara')!, -3661)).toBe(false);
    expect(styleExists(STYLE_BY_ID.get('ktara')!, 0)).toBe(true);
    expect(styleExists(STYLE_BY_ID.get('hijkata')!, 0)).toBe(false);
  });
  it('a style can\'t start without a teacher or a recorded source, under the who-teaches-outsiders rulings', () => {
    const human = { species: 'human' as const, forceSensitive: false };
    expect(styleAccess('terasKasi', { year: -3661, student: human })).toMatch(/teacher or a recorded source/);
    expect(styleAccess('terasKasi', { year: -3661, student: human, record: true })).toBeNull();
    // A Teräs Käsi teacher must be a graduate master.
    expect(styleAccess('terasKasi', { year: -3661, student: human, teacher: { species: 'human', faction: 'civilian', holds: 0.6 } })).toMatch(/does not teach/);
    expect(styleAccess('terasKasi', { year: -3661, student: human, teacher: { species: 'human', faction: 'civilian', holds: 0.95 } })).toBeNull();
    // The full Echani art stays in the castes; outsiders learn the military version.
    expect(styleAccess('echani', { year: -3661, student: human, teacher: { species: 'echani', faction: 'civilian', holds: 1 } })).toMatch(/castes/);
    expect(styleAccess('echaniMilitary', { year: -3661, student: human, teacher: { species: 'echani', faction: 'civilian', holds: 0 } })).toBeNull();
    // Stava only to outsiders after 9 ABY.
    expect(styleAccess('stava', { year: 5, student: human, teacher: { species: 'human', faction: 'civilian', holds: 1 } })).toMatch(/9 ABY/);
    expect(styleAccess('stava', { year: 10, student: human, teacher: { species: 'human', faction: 'civilian', holds: 1 } })).toBeNull();
    // Mandalorians take anyone.
    expect(styleAccess('mandalorian', { year: -3661, student: human, teacher: { species: 'human', faction: 'mandalorians', holds: 0 } })).toBeNull();
    // Matukai needs the Force.
    expect(styleAccess('matukai', { year: -3661, student: human, record: true })).toMatch(/Force/);
  });
  it('style training through the game: refused without a source, then gives Melee XP and grows the style', () => {
    const s = fresh({ archetype: 'warrior' });
    expect(resolveTraining(s, { activityId: 'styleTraining', styleId: 'mandalorian', hours: 2 }).ok).toBe(false);
    const p = train(s, { activityId: 'styleTraining', styleId: 'mandalorian', hours: 2, source: { kind: 'record', id: 'manual:mandalorian' } });
    const after = engine(s, p.events).state;
    expect(xpOf(after, 'melee')).toBeGreaterThan(xpOf(s, 'melee'));
    expect(selectStyles(after)['mandalorian']!).toBeGreaterThan(0);
    // Once held it trains alone.
    expect(resolveTraining(after, { activityId: 'styleTraining', styleId: 'mandalorian', hours: 1 }).ok).toBe(true);
  });
  it('a style adds at most +5 at 100%; Teräs Käsi up to +10', () => {
    for (const m of MARTIAL_STYLES) expect(styleBonus(m, 1), m.id).toBe(m.id === 'terasKasi' ? 10 : 5);
    expect(styleBonus(STYLE_BY_ID.get('echaniMilitary')!, 0.5)).toBeCloseTo(2.5, 6);
  });
  it('higher Melee learns faster: up to +50% at Melee 100, on a smooth curve', () => {
    expect(styleLearnMult(0)).toBe(1);
    expect(styleLearnMult(100)).toBeCloseTo(1.5, 6);
    expect(styleLearnMult(150)).toBeCloseTo(1.5, 6);
    expect(styleLearnMult(50)).toBeGreaterThan(1);
    expect(styleLearnMult(50)).toBeLessThan(1.5);
    const low = styleGain(undefined, 50, 10, 0).p;
    const high = styleGain(undefined, 50, 90, 0).p;
    expect(high).toBeGreaterThan(low);
    // Fast next to skills: about 75% in 150 practice hours.
    expect(styleGain(undefined, 150, 0, 0).p).toBeGreaterThan(0.7);
    expect(styleGain(undefined, 150, 0, 0).p).toBeLessThan(0.8);
  });
  it('fades slowly to about half its peak, and comes back quickly with use', () => {
    const st = { p: 1, peak: 1, lastDay: 0 };
    expect(styleNow(st, 20)).toBe(1);
    const year = styleNow(st, 400);
    expect(year).toBeLessThan(1);
    expect(year).toBeGreaterThan(0.7);
    const long = styleNow(st, 10_000);
    expect(long).toBeCloseTo(STYLE.fade.floor, 2);
    // Back to the peak in far fewer hours than it took to build: 0 -> 0.9 takes about 249 practice hours; from the faded
    // 0.45 back to 0.9 about a third of the climb (x3).
    const st9 = { p: 0.9, peak: 0.9, lastDay: 0 };
    const faded = styleNow(st9, 10_000);
    expect(styleGain(st9, 65, 0, 10_000).p).toBeGreaterThanOrEqual(0.9 - 1e-9);
    expect(styleGain(undefined, 65, 0, 0).p).toBeLessThan(0.5);
    expect(faded).toBeCloseTo(0.45, 2);
  });
  it('stacking: weapon proficiency multiplies the skill, the style adds to it; unarmed styles only unarmed', () => {
    expect(stackedSkill(60, 0.85, 5)).toBeCloseTo(60 * 0.85 + 5, 6);
    expect(fightStyle({ terasKasi: 1 }, false, 80)).toBeNull();
    expect(fightStyle({ terasKasi: 1 }, true, 80)?.bonus).toBe(10);
    expect(fightStyle({ mandalorian: 1 }, false, 80)?.bonus).toBe(5);
    expect(fightStyle({ mandalorian: 1, terasKasi: 1 }, true, 80)?.id).toBe('terasKasi');
  });
  it('Teräs Käsi: speed on the melee contest, strike power by proficiency', () => {
    expect(terasKasiSpeed(1)).toBe(TERAS_KASI.speed);
    expect(terasKasiSpeed(0.5)).toBe(1);
    expect(terasKasiStrike(0.4).pistolShare).toBe(0);
    expect(terasKasiStrike(1).pistolShare).toBe(1);
    expect(terasKasiStrike(1).armourIgnored.light).toBeGreaterThan(terasKasiStrike(1).armourIgnored.medium);
  });
  it('Teräs Käsi anticipation needs 100% and Melee 81+, doubles at 101+, and never stacks with Force Sense', () => {
    expect(terasKasiAnticipation(0.99, 95)).toBe(0);
    expect(terasKasiAnticipation(1, 80)).toBe(0);
    const master = terasKasiAnticipation(1, 81);
    expect(master).toBeCloseTo(forceSensePrecog(81) / 2, 6);
    const grand = terasKasiAnticipation(1, 101);
    expect(grand).toBeCloseTo(forceSensePrecog(101), 6);
    expect(grand).toBeGreaterThan(master * 1.9);
    // The higher of the fighter's own precognition and the anticipation, never both.
    expect(precogDefence(60, master)).toBe(Math.max(forceSensePrecog(60), master));
    expect(precogDefence(0, master)).toBe(master);
    expect(precogDefence(100, grand)).toBe(forceSensePrecog(100));
  });
  it('no style lets a non-Force fighter beat a top duelist (duel tiers still rule)', () => {
    const grandmaster = { forceUser: false, masterRank: true, meetsMasterSkills: true, combat: 120, forceControl: 0, willpower: 100 };
    expect(duelTier(grandmaster)).toBe('below');
    expect(canBeat(duelTier(grandmaster), 'top')).toBe(false);
    expect(canBeat(duelTier(grandmaster), 'apex')).toBe(false);
  });
  it('a player\'s style comes into the fight on Melee or unarmed, not with a saber or a blaster', () => {
    let s = withLevel(fresh({ archetype: 'warrior' }), 'melee', 90);
    s = engine(s, [{ type: 'styleSet', styleId: 'mandalorian', p: 1 }]).state;
    const f = buildPlayerFighter(s);
    expect(f.skillId).toBe('melee');
    expect(f.style?.bonus).toBe(5);
  });
});

describe('training programmes (spec §6)', () => {
  it('programmes run their lengths from the sources (or Jared\'s defaults)', () => {
    const years: Record<string, number> = { caridaStormtrooper: 2, caridaFull: 4, caridaFlight: 2, prefsbelt: 3, royalGuard: 1, raithal: 1, verdGoten: 5, cloneRegular: 10, cloneCommando: 10, officerAcademy: 3.5, university: 4 };
    for (const [id, y] of Object.entries(years)) {
      const p = PROGRAMME_BY_ID.get(id)!;
      expect(programmeYears(p), id).toBe(y);
      expect(programmeEndDay(p, 1000) - 1000, id).toBe(Math.round(y * DAYS_PER_YEAR));
    }
    for (const p of TRAINING_PROGRAMMES) expect(Object.values(programmeShares(p)).reduce((a, b) => a + b, 0), p.id).toBeCloseTo(1, 9);
  });
  it('entry rules: dates, ages and species', () => {
    expect(programmeEntry(PROGRAMME_BY_ID.get('caridaStormtrooper')!, { age: 18, year: -3661, species: 'human', archetype: 'soldier' })).toMatch(/does not exist/);
    expect(programmeEntry(PROGRAMME_BY_ID.get('caridaStormtrooper')!, { age: 18, year: -10, species: 'human', archetype: 'soldier' })).toBeNull();
    expect(programmeEntry(PROGRAMME_BY_ID.get('hrrtayyk')!, { age: 12, year: -3661, species: 'human', archetype: 'civilian' })).not.toBeNull();
    expect(programmeEntry(PROGRAMME_BY_ID.get('hrrtayyk')!, { age: 12, year: -3661, species: 'wookiee', archetype: 'civilian' })).toBeNull();
  });
  it('enrolling sets the end day; the routine follows the curriculum; the programme ends with its graduation', () => {
    let s = fresh({ age: 18 });
    const r = player(s, [{ type: 'programmeEnrolled', programmeId: 'officerAcademy' }]);
    expect(r.rejected).toEqual([]);
    s = r.state;
    expect(s.ranks.programme!.endDay - s.ranks.programme!.startDay).toBe(Math.round(3.5 * DAYS_PER_YEAR));
    // Near the end: one more day finishes it.
    s = { ...s, ranks: { ...s.ranks, programme: { ...s.ranks.programme!, endDay: s.clock.now.day + 1 } } };
    const done = advanceTime(REGISTRY, s, { seconds: 86_400, reason: 'a day', source: 'turnDraft' });
    expect(done.state.ranks.programme).toBeUndefined();
    expect(done.notices.join(' ')).toMatch(/commissioned lieutenant/);
  });
});

describe('archetypes (spec §7)', () => {
  const at = (id: string, age = 45) => npcLevelsFor({ archetype: id, path: 'career', talents: {}, startAge: ARCHETYPE_BY_ID.get(id)!.startAge, warYears: 0, rank: 'career', seed: `t:${id}`, minionGrade: 1 }, 'human', age, day(-3661));
  const CAREER_SKILLS = ['tactics', 'intelligence', 'charisma', 'investigation', 'stealth', 'blaster', 'melee', 'piloting', 'gunnery', 'repair', 'medicine', 'tracking', 'profession'];
  const top = (lv: Readonly<Record<string, number>>): string => CAREER_SKILLS.reduce((a, b) => ((lv[b] ?? 0) > (lv[a] ?? 0) ? b : a));
  it('each new archetype\'s line leads in its focus stat', () => {
    for (const id of ['officer', 'navalOfficer', 'intelAnalyst', 'intelAgent', 'politician', 'scholar', 'starfighterPilot', 'shipGunner', 'engineer']) expect(top(at(id)), id).toBe(ARCHETYPE_BY_ID.get(id)!.main);
    expect(PATH_ARCHETYPES.career).toEqual(expect.arrayContaining(['officer', 'intelAnalyst', 'intelAgent', 'politician', 'scholar']));
  });
  it('the officer: Tactics, then Intelligence, then Charisma; a smaller Blaster share; Piloting for naval officers', () => {
    const o = at('officer');
    expect(o['tactics']!).toBeGreaterThan(o['intelligence']!);
    expect(o['intelligence']!).toBeGreaterThan(o['charisma']!);
    expect(o['charisma']!).toBeGreaterThan(o['blaster']!);
    expect(at('navalOfficer')['piloting']!).toBeGreaterThan(o['piloting'] ?? 0);
  });
  it('the field agent and the analyst differ as set, and an intelligence officer trails an officer only in Tactics', () => {
    const o = at('officer');
    const an = at('intelAnalyst');
    const ag = at('intelAgent');
    expect(an['intelligence']!).toBeGreaterThan(ag['intelligence']!);
    expect(an['investigation']!).toBeGreaterThan(ag['investigation']!);
    expect(ag['stealth']!).toBeGreaterThan(an['stealth'] ?? 0);
    expect(ag['melee']!).toBeGreaterThan(an['melee'] ?? 0);
    expect(ag['blaster']!).toBeGreaterThan(an['blaster']!);
    // Both lines trail the officer in Tactics.
    expect(an['tactics'] ?? 0).toBeLessThan(o['tactics']!);
    expect(ag['tactics'] ?? 0).toBeLessThan(o['tactics']!);
    // The service is ahead or level on every other stat the officer trains (the better of its two lines).
    for (const k of ['intelligence', 'charisma', 'investigation', 'stealth', 'blaster', 'melee', 'strength', 'agility', 'endurance']) expect(Math.max(an[k] ?? 0, ag[k] ?? 0) + 0.5, k).toBeGreaterThanOrEqual(o[k] ?? 0);
  });
  it('a politician\'s Charisma reaches the diplomats\' 60-80 in mid-career; little combat', () => {
    const p = at('politician', 50);
    expect(p['charisma']!).toBeGreaterThan(60);
    expect(p['charisma']!).toBeLessThan(80);
    expect(p['blaster'] ?? 0).toBeLessThan(15);
  });
});

describe('rank ladders (spec §8)', () => {
  it('every faction branch is dated data with the lore\'s titles where they differ', () => {
    expect(SERVICE_LADDERS.length).toBeGreaterThan(10);
    expect(SERVICE_LADDER_BY_ID.get('republicArmy')!.rungs.map((r) => r.title)).toEqual(['lieutenant', 'captain', 'major', 'colonel', 'general', 'Supreme Commander']);
    expect(SERVICE_LADDER_BY_ID.get('republicNavy')!.rungs.map((r) => r.title)).toEqual(['ensign', 'lieutenant', 'captain', 'commodore', 'admiral']);
    expect(SERVICE_LADDER_BY_ID.get('sithImperialIntelligence')!.rungs.map((r) => r.title)).toEqual(['Cipher agent', 'Watcher', 'Keeper', 'Minister of Intelligence']);
    expect(SERVICE_LADDER_BY_ID.get('sis')!.rungs.map((r) => r.title)).toContain('Bureau Chief');
  });
  it('promotion takes years of service, a skill minimum and recorded deeds', () => {
    const l = SERVICE_LADDER_BY_ID.get('republicArmy')!;
    const lv = (k: string): number => (k === 'tactics' ? 40 : 0);
    expect(servicePromotionCheck(l, 1, { yearsInRank: 4, level: lv, deeds: 1 }).ok).toBe(true);
    expect(servicePromotionCheck(l, 1, { yearsInRank: 3, level: lv, deeds: 1 }).reasons.join(' ')).toMatch(/years/);
    expect(servicePromotionCheck(l, 1, { yearsInRank: 4, level: () => 30, deeds: 1 }).reasons.join(' ')).toMatch(/tactics 35/);
    expect(servicePromotionCheck(l, 1, { yearsInRank: 4, level: lv, deeds: 0 }).reasons.join(' ')).toMatch(/deeds/);
    // A story-only rung is never reached by promotion.
    expect(servicePromotionCheck(l, 4, { yearsInRank: 50, level: () => 200, deeds: 99 }).reasons.join(' ')).toMatch(/appointment/);
  });
  it('through the game: join, earn deeds, be promoted (with the pay grade); the AI can only propose', () => {
    let s = withLevel(fresh({ archetype: 'officer' }), 'tactics', 30);
    s = player(s, [{ type: 'serviceJoined', ladderId: 'republicArmy' }]).state;
    expect(s.ranks.service?.rung).toBe(0);
    expect(s.economy.job).toMatchObject({ kind: 'military', grade: 'lieutenant' });
    const early = applyEvents(REGISTRY, s, [{ type: 'servicePromotionProposed' }] as GameEvent[], { source: 'ai' });
    expect(early.rejected[0]?.reason).toMatch(/years/);
    s = { ...s, ranks: { ...s.ranks, service: { ...s.ranks.service!, since: s.clock.now.day - 4 * DAYS_PER_YEAR } } };
    const promoted = applyEvents(REGISTRY, s, [{ type: 'servicePromotionProposed' }] as GameEvent[], { source: 'ai' });
    expect(promoted.rejected).toEqual([]);
    expect(promoted.state.ranks.service?.rung).toBe(1);
    expect(promoted.state.economy.job).toMatchObject({ kind: 'military', grade: 'captain' });
    // Deeds: a battle won in command while serving.
    const deed = engine(promoted.state, [{ type: 'playXpEarned', source: 'command', stakes: 'serious', outcome: 'won', size: 'company' }]).state;
    expect(deed.ranks.service?.deeds).toBe(1);
    expect(selectLevelExact(deed, 'tactics')).toBeGreaterThan(selectLevelExact(promoted.state, 'tactics'));
  });
});
