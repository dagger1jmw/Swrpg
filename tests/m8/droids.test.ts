// Droids (M8 checklist item 7; docs-v2/spec/droids.md section 10). Also the run's other items: bacta and kolto prices,
// Luke's five sheets, canon rank dates over the age minimum.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { DROID_SHIELD, LEARNING, MODULES, WIPE_PRICE } from '../../src/data/droids.config';
import { DROID_MODEL_BY_ID, DROID_MODELS } from '../../src/data/droidModels';
import { TIER_LEVELS } from '../../src/data/duelists';
import { PRICE_BY_ID, resolvePriceId } from '../../src/data/economyPrices';
import { FORM_IDS } from '../../src/data/skills';
import { absDayFromDate, DAYS_PER_YEAR, SECONDS_PER_DAY } from '../../src/engine/calendar';
import { canonAbsence, canonRankAt } from '../../src/engine/canonRoster';
import {
  applyDroidHit,
  astromechHooks,
  crewWithAstromech,
  damageSteps,
  droidStatus,
  isFullCompanion,
  modelForKind,
  modelInService,
  modelsInService,
  newDroid,
  orderOutcome,
  personalityP,
  personalityStage,
  quirksOf,
  ratedSkills,
  repairJob,
  resolveModel,
  skillNow,
  wiped,
  type DroidUnit,
} from '../../src/engine/droids';
import { seedRng } from '../../src/engine/rng';
import { crewOf } from '../../src/engine/ships';
import { computeCreation } from '../../src/features/character/creation';
import { howFromWords, skillFromWords, weaponFromWords } from '../../src/features/droids';
import { selectAstromech, selectDroidLines } from '../../src/features/droids/selectors';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { GameEvent } from '../../src/state/types';
import { TEST_START_DATE } from '../support/dates';

const day = (year: number, month = 3, d = 1): number => absDayFromDate({ year, month, day: d });
const D = day(-3661);
const NOW = D * SECONDS_PER_DAY;
const unit = (modelId: string, o: Partial<Parameters<typeof newDroid>[1]> = {}): DroidUnit => newDroid(DROID_MODEL_BY_ID.get(modelId)!, { id: 'droid-1', name: 'T3-K7', seed: 'x', how: 'bought', day: D, ...o });

function fresh(year = -3661, credits = 100_000): GameState {
  const d = day(year);
  const s = createInitialState<GameState>(REGISTRY, {
    campaignId: 'droids',
    branchId: 'b',
    seed: 'droids',
    start: { day: d, second: 8 * 3600 },
    character: { name: 'Tal', birthDay: d - 30 * 368, path: 'career', archetype: 'smuggler' } as never,
    rank: 'career',
  } as never);
  return { ...s, economy: { ...s.economy, wallet: { republic: credits, imperial: 0, hutt: 0 } } };
}
const ai = (s: GameState, events: object[]) => applyEvents(REGISTRY, s, events as GameEvent[], { source: 'ai' });
const notes = (r: ReturnType<typeof ai>): string => r.applied.flatMap((a) => a.notes).join(' | ');

describe('droids as data (spec §1)', () => {
  it('model availability follows each model\'s dates', () => {
    const in3661 = modelsInService(-3661).map((m) => m.id);
    expect(in3661).toContain('t7');
    expect(in3661).toContain('ge3');
    expect(in3661).not.toContain('r2');
    expect(in3661).not.toContain('b1');
    expect(modelsInService(-19).map((m) => m.id)).toEqual(expect.arrayContaining(['r2', 'threePo', 'b1', 'md']));
    expect(modelInService(DROID_MODEL_BY_ID.get('t3')!, -3956)).toBe(true);
    expect(modelInService(DROID_MODEL_BY_ID.get('basilisk')!, -3661)).toBe(false);
    // The date's model of a kind, and a generic one where the lore has a gap.
    expect(modelForKind('astromech', -3661).id).toBe('t3');
    expect(modelForKind('astromech', -3600).id).toBe('t7');
    expect(modelForKind('protocol', -1000).id).toBe('protocolGeneric');
    for (const m of DROID_MODELS) {
      expect(m.source.length, m.id).toBeGreaterThan(10);
      if (m.price !== null) expect(m.priceTier, m.id).not.toBeNull();
    }
  });
  it('a narrator\'s words name the model and its catalog row', () => {
    expect(resolveModel('a salvaged T3 unit')?.id).toBe('t3');
    expect(resolveModel('an HK assassin droid')?.id).toBe('hk');
    expect(resolveModel('an old astromech')?.id).toBe('astromechGeneric');
    expect(resolvePriceId('a T3 utility droid')).toBe('droid:t3');
    expect(resolvePriceId('an R2 unit')).toBe('droid:r2');
    expect(PRICE_BY_ID.get('droid:hk')?.legality).toBe('restricted');
    expect(PRICE_BY_ID.get('droid:ge3')?.base).toBe(2500);
  });
});

describe('skills (spec §3)', () => {
  it('skills come from the class and programming; learning while unwiped; a wipe takes the learning', () => {
    const fresh0 = unit('t3');
    const r = ratedSkills(fresh0, D);
    expect(r.repair).toBe(45);
    expect(r.medicine).toBeUndefined();
    const old = unit('t3', { pastYears: 30 });
    expect(ratedSkills(old, D).repair!).toBeGreaterThan(45 + LEARNING.most * 0.9);
    expect(ratedSkills(wiped(old, D), D).repair).toBe(45);
  });
  it('a module upgrade raises a skill and needs credits, a roll and (for big jobs) a shop', () => {
    let s = fresh();
    s = ai(s, [{ type: 'trade', dir: 'buy', item: 'a T7 astromech' }]).state;
    const before = ratedSkills(s.droids.units[0]!, s.clock.now.day).astrogation!;
    // A big job without a shop is refused.
    const noShop = ai(s, [{ type: 'droid', what: 'installed an advanced astrogation module' }]);
    expect(noShop.rejected[0]?.reason).toMatch(/needs a droid shop/);
    // At a shop the job is rolled and paid; over a few seeds it succeeds at least once and always charges.
    let ok = 0;
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const t = { ...s, meta: { ...s.meta, rngState: seedRng(seed) } };
      const r = ai(t, [{ type: 'droid', what: 'installed an advanced astrogation module at a droid shop' }]);
      expect(r.rejected).toEqual([]);
      expect(r.state.economy.wallet.republic).toBeLessThan(t.economy.wallet.republic);
      expect(notes(r)).toMatch(/DC/);
      const after = ratedSkills(r.state.droids.units[0]!, r.state.clock.now.day).astrogation!;
      if (after > before) {
        ok++;
        expect(after).toBeCloseTo(before + MODULES.advanced.gain, 6);
      }
    }
    expect(ok).toBeGreaterThan(0);
    // The character's own work needs a tool kit (m8-skills, D-513); then no credits, no job.
    expect(ai(s, [{ type: 'droid', what: 'installed a basic repair module' }]).rejected[0]?.reason).toMatch(/tool kit/);
    const broke = { ...s, droids: { ...s.droids, toolKit: true }, economy: { ...s.economy, wallet: { republic: 10, imperial: 0, hutt: 0 } } };
    expect(ai(broke, [{ type: 'droid', what: 'installed a basic repair module' }]).rejected[0]?.reason).toMatch(/cannot afford/);
  });
});

describe('memory and personality (spec §4)', () => {
  it('personality grows with time unwiped; a wipe resets it with no alignment effect', () => {
    const u = unit('t3');
    expect(personalityStage(personalityP(u, D))).toBe('basic');
    expect(quirksOf(u, D)).toEqual([]);
    const later = D + 3 * DAYS_PER_YEAR;
    expect(personalityStage(personalityP(u, later))).not.toBe('basic');
    expect(isFullCompanion(u, D + 20 * DAYS_PER_YEAR)).toBe(true);
    // Fresh from the factory is never a full companion; a droid with a past can be.
    expect(isFullCompanion(u, D)).toBe(false);
    expect(isFullCompanion(unit('t3', { how: 'salvage', pastYears: 15 }), D)).toBe(true);
    // A wipe in play: back to basic, a shop bill, and nothing else (no alignment, flag or standing event).
    let s = fresh();
    s = ai(s, [{ type: 'droid', what: 'salvaged a T7 astromech named Patch' }]).state;
    const u2 = { ...s.droids.units[0]!, wipedDay: s.clock.now.day - 20 * DAYS_PER_YEAR };
    s = { ...s, droids: { ...s.droids, units: [u2] } };
    const r = ai(s, [{ type: 'droid', what: "wiped Patch's memory" }]);
    expect(r.rejected).toEqual([]);
    expect(personalityStage(personalityP(r.state.droids.units[0]!, r.state.clock.now.day))).toBe('basic');
    expect(r.applied.map((a) => a.event.type)).toEqual(['droid', 'creditsCharged']);
    // A new droid is bought with trade, never for free through the droid event.
    expect(ai(fresh(), [{ type: 'droid', what: 'bought a T7 astromech' }]).rejected[0]?.reason).toMatch(/bought with trade/);
    expect(r.state.economy.wallet.republic).toBe(s.economy.wallet.republic - WIPE_PRICE);
    expect(r.state.flags).toEqual(s.flags);
    expect(r.state.economy.darkChoices).toEqual(s.economy.darkChoices);
    expect(notes(r)).toMatch(/not a dark-side act/);
  });
  it('a restraining bolt forces obedience, and a resistant droid can break it', () => {
    const plain = { ...unit('t3'), bolt: true };
    for (const roll of [0, 0.5, 0.99]) expect(orderOutcome(plain, D, true, roll)).toEqual({ obeys: true, broke: false });
    const hk = { ...unit('hk'), bolt: true };
    expect(orderOutcome(hk, D, true, 0.1)).toEqual({ obeys: false, broke: true });
    expect(orderOutcome(hk, D, true, 0.9)).toEqual({ obeys: true, broke: false });
    // Without a bolt, a droid with its own judgement refuses an order against its will when it does not regard its owner well.
    const free = unit('t3', { how: 'found', pastYears: 20 });
    expect(orderOutcome(free, D, true, 0.5).obeys).toBe(false);
    expect(orderOutcome({ ...free, regard: 3 }, D, true, 0.5).obeys).toBe(true);
    // In play: a bolt fitted, an order forced through it.
    let s = fresh();
    s = ai(s, [{ type: 'droid', what: 'was given a GE3 protocol droid named Tee' }]).state;
    s = ai(s, [{ type: 'droid', what: 'fitted a restraining bolt to Tee' }]).state;
    expect(s.droids.units[0]!.bolt).toBe(true);
    expect(notes(ai(s, [{ type: 'droid', what: 'ordered Tee against its will' }]))).toMatch(/obeys the restraining bolt/);
  });
});

describe('damage (spec §5)', () => {
  it('damage lands on systems by location and is repaired, not healed', () => {
    const u = unit('t7');
    const r = applyDroidHit(u, { kind: 'physical', power: 20 }, NOW, 0.1);
    expect(r.location).toBe('limbs');
    expect(r.unit.systems.limbs).toBe('disabled');
    expect(droidStatus(r.unit, NOW)).toBe('damaged');
    expect(skillNow(r.unit, 'repair', D, NOW)).toBe(0);
    const proc = applyDroidHit(u, { kind: 'physical', power: 40 }, NOW, 0.95);
    expect(proc.location).toBe('processor');
    expect(droidStatus(proc.unit, NOW)).toBe('destroyed');
    expect(damageSteps(2, DROID_MODEL_BY_ID.get('t7')!)).toBe(0);
    expect(repairJob(r.unit, 'limbs')).toMatchObject({ big: true, from: 'disabled' });
    // The health slice never sees a droid's damage.
    let s = fresh();
    s = ai(s, [{ type: 'trade', dir: 'buy', item: 'a T7 astromech' }]).state;
    const hit = ai(s, [{ type: 'droid', what: 'hit by a blaster rifle' }]);
    expect(hit.state.health).toEqual(s.health);
    const hurt = { ...hit.state, droids: { ...hit.state.droids, units: [{ ...hit.state.droids.units[0]!, systems: { sensors: 'damaged' as const } }] } };
    const fixed = ai(hurt, [{ type: 'droid', what: 'repaired at a droid shop' }]);
    expect(fixed.rejected).toEqual([]);
    expect(notes(fixed)).toMatch(/DC/);
    expect(fixed.state.economy.wallet.republic).toBeLessThan(hurt.economy.wallet.republic);
  });
  it('ion weapons and Ionize disable', () => {
    const u = unit('markIAssault', { name: 'Mk1' });
    const ion = applyDroidHit(u, { kind: 'ion', power: 45 }, NOW, 0.5);
    expect(droidStatus(ion.unit, NOW)).toBe('disabled');
    expect(droidStatus(ion.unit, NOW + 31 * 60)).toBe('working');
    expect(ion.unit.systems).toEqual({});
    expect(ion.unit.shieldStops).toBe(0);
    const ionize = applyDroidHit(unit('t7'), { kind: 'ionize', power: 60, margin: 25 }, NOW, 0.5);
    expect(droidStatus(ionize.unit, NOW)).toBe('disabled');
    expect(ionize.unit.systems.processor).toBe('damaged');
    expect(weaponFromWords('an ion grenade')).toBe('ionGrenade');
    expect(weaponFromWords('Ionize')).toBe('ionize');
  });
  it('a droid shield stops a bolt', () => {
    const u = unit('markIAssault');
    expect(u.shieldStops).toBe(DROID_SHIELD.stops);
    const r = applyDroidHit(u, { kind: 'physical', power: 60 }, NOW, 0.5);
    expect(r.stoppedByShield).toBe(true);
    expect(r.unit.systems).toEqual({});
    expect(r.unit.shieldStops).toBe(DROID_SHIELD.stops - 1);
    // Unshielded, the same hit wrecks a location.
    expect(applyDroidHit(unit('t7'), { kind: 'physical', power: 60 }, NOW, 0.5).steps).toBe(3);
  });
});

describe('companions and roles (spec §6)', () => {
  it('the astromech hooks return what the ship rules need', () => {
    const h = astromechHooks(unit('t7'), D, NOW);
    expect(h).toMatchObject({ starfighterInterface: true });
    expect(h.astrogation).toBeGreaterThan(40);
    expect(h.repair).toBeGreaterThan(40);
    expect(h.copilot).toBeGreaterThanOrEqual(1);
    expect(crewWithAstromech(crewOf(10), h).repair).toBe(h.repair);
    expect(astromechHooks(unit('ge3'), D, NOW).starfighterInterface).toBe(false);
    // Ionized, it gives nothing.
    const off = applyDroidHit(unit('t7'), { kind: 'ion', power: 45 }, NOW, 0).unit;
    expect(astromechHooks(off, D, NOW)).toMatchObject({ astrogation: 0, repair: 0, copilot: 0 });
    let s = fresh();
    s = ai(s, [{ type: 'trade', dir: 'buy', item: 'an astromech' }]).state;
    expect(selectAstromech(s)?.unit.modelId).toBe('t3');
  });
  it('a player can\'t create a droid character', () => {
    const start = absDayFromDate(TEST_START_DATE);
    const c = computeCreation({ name: 'R5', birthDay: start - 20 * 368, startDay: start, speciesId: 'droid', path: 'outsider', archetype: 'smuggler', rank: 'none', trainingStartAge: null, talents: {}, dominantHand: 'right' } as never);
    expect(c.errors.join(' ')).toMatch(/cannot play a droid/);
  });
  it('the narrator sees owned droids and the models sold this year', () => {
    let s = fresh();
    s = ai(s, [{ type: 'trade', dir: 'buy', item: 'a T7 astromech' }]).state;
    const t = selectDroidLines(s).join('\n');
    expect(t).toMatch(/Models sold this year: .*T7 astromech droid/);
    expect(t).toMatch(/T7 astromech droid, class 2\); personality basic/);
    expect(t).toMatch(/not a dark-side act/);
  });
});

describe('legal status (spec §7)', () => {
  it('droids are bought, sold and impounded through the economy', () => {
    let s = fresh();
    const r = ai(s, [{ type: 'trade', dir: 'buy', item: 'a T7 astromech' }]);
    expect(r.applied.map((a) => a.event.type)).toEqual(['trade', 'droidAcquired']);
    s = r.state;
    expect(s.economy.wallet.republic).toBeLessThan(100_000);
    // A model out of its years cannot be bought.
    expect(ai(s, [{ type: 'trade', dir: 'buy', item: 'an R2 unit' }]).rejected[0]?.reason).toMatch(/no R2 astromech droid units in 3661 BBY/);
    // Impounded: reclaimed for a fee.
    s = ai(s, [{ type: 'droid', what: 'impounded by the port authority' }]).state;
    expect(s.droids.units[0]!.impounded).toBe(true);
    expect(ai(s, [{ type: 'trade', dir: 'sell', item: 'a T7 astromech' }]).rejected[0]?.reason).toMatch(/no T7 astromech droid owned/);
    const back = ai(s, [{ type: 'droid', what: 'reclaimed from the impound' }]);
    expect(back.state.droids.units[0]!.impounded).toBe(false);
    expect(back.state.economy.wallet.republic).toBeLessThan(s.economy.wallet.republic);
    s = back.state;
    // Sold to a dealer: the unit goes, the wallet grows.
    const sold = ai(s, [{ type: 'trade', dir: 'sell', item: 'a T7 astromech' }]);
    expect(sold.state.droids.units).toEqual([]);
    expect(sold.state.economy.wallet.republic).toBeGreaterThan(s.economy.wallet.republic);
    // A second-hand droid costs half, and comes with a past.
    const used = ai(fresh(), [{ type: 'droid', what: 'bought a second-hand T7 astromech' }]);
    expect(used.state.economy.wallet.republic).toBe(100_000 - 2000);
    expect(howFromWords('a stolen HK')).toBe('stolen');
    expect(skillFromWords('an advanced navigation module')).toBe('astrogation');
  });
  it('a droid never counts as a Jedi\'s personal holding', () => {
    const s = createInitialState<GameState>(REGISTRY, { campaignId: 'j', branchId: 'b', seed: 'j', start: { day: D, second: 8 * 3600 }, character: { name: 'Kael', birthDay: D - 30 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 } as never, rank: 'knight' } as never);
    const rich = { ...s, economy: { ...s.economy, wallet: { republic: 100_000, imperial: 0, hutt: 0 } } };
    expect(ai(rich, [{ type: 'trade', dir: 'buy', item: 'a GE3 protocol droid' }]).state.economy.possessions).toBe(0);
  });
});

describe('the run\'s other items (F)', () => {
  it('Luke\'s line runs through five sheets: LotF at 40 ABY, FotJ at 43; apex lines met from 25 ABY', () => {
    const luke = CANON_BY_ID.get('lore:luke-skywalker')!;
    const at = (aby: number) => canonFigureLevelsAt(luke, -aby, absDayFromDate({ year: aby, month: 1, day: 1 }));
    const main = (l: Readonly<Record<string, number>>) => Math.max(...FORM_IDS.map((f) => l[f] ?? 0));
    expect(luke.anchors.map((a) => a.bby)).toEqual([-4, -19, -25, -40, -43]);
    const l40 = at(40);
    const l43 = at(43);
    expect([main(l40), l40['forceControl'], l40['forceOutput'], l40['willpower']]).toEqual([102, 126, 134, 106]);
    expect([main(l43), l43['forceControl'], l43['forceOutput'], l43['willpower']]).toEqual([104, 138, 138, 108]);
    for (const aby of [25, 30, 36, 40, 43, 45]) {
      const l = at(aby);
      expect(main(l), `combat ${aby}`).toBeGreaterThanOrEqual(TIER_LEVELS.apex.combat);
      expect(l['forceControl']!, `FC ${aby}`).toBeGreaterThanOrEqual(TIER_LEVELS.apex.forceControl);
      expect(l['willpower']!, `WP ${aby}`).toBeGreaterThanOrEqual(TIER_LEVELS.apex.willpower);
    }
  });
  it('a rank date on record beats the role\'s age minimum (Luke a Master from 11 ABY)', () => {
    const luke = CANON_BY_ID.get('lore:luke-skywalker')!;
    expect(canonRankAt(luke, -11)?.role).toBe('jediMaster');
    expect(canonAbsence(luke, -11)).toBeNull();
    expect(canonAbsence(CANON_BY_ID.get('lore:darth-thanaton')!, 3678)).toBeNull();
    expect(canonAbsence(CANON_BY_ID.get('lore:the-barsenthor')!, 3640)).toBeNull();
  });
});
