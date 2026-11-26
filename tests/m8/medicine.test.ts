// Medicine (M8 checklist item 6; docs-v2/spec/medicine.md section 11; D-511). The code owns care: levels, times, outcomes,
// costs. Also the run's J items: Krayt apex, Luke's line, Vrath Xizor the sniper, Jedi wealth.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { duelistBar, TIER_LEVELS } from '../../src/data/duelists';
import { JEDI_MONEY } from '../../src/data/economy.config';
import { HEAL_DAYS, LASTING_CHANCE } from '../../src/data/health.config';
import { CARE_MULT, SURGERY, TANK_DAY, UNTREATED } from '../../src/data/medicine.config';
import { FORM_IDS } from '../../src/data/skills';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { damageFighter } from '../../src/engine/duel';
import { baseHealDays, healMultiplier, progressHealing } from '../../src/engine/healing';
import type { LastingInjury } from '../../src/engine/lasting';
import { lastingPenaltyOf } from '../../src/engine/lasting';
import { aidHit, careIsFree, outcomeShares, surgeryRefusal, surgeryRoll, tankDayPrice, tankFluid, treatmentOutcome, treatmentQuality, untreatedOutcome, untreatedRiskFactor } from '../../src/engine/medicine';
import { seedRng } from '../../src/engine/rng';
import type { Wound } from '../../src/engine/wounds';
import { healAll, riskDay } from '../../src/features/health/medicine';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { GameEvent, Registry } from '../../src/state/types';
import { carePlan } from '../../src/turn/medicine';
import { forceUser, REAL } from '../support/duelSim';

// Only health's day hook runs: the others are not under test and are slow over weeks.
const HEALTH: Registry<GameState> = REGISTRY.map((f) => {
  if (f.id === 'health') return f;
  const { onTimeAdvanced: _h, ...rest } = f;
  return rest;
});
const dayOf = (year: number): number => absDayFromDate({ year, month: 3, day: 1 });
function fresh(o: { year?: number; path?: 'jedi' | 'career'; archetype?: string; xp?: Record<string, number>; start?: object } = {}): GameState {
  const d = dayOf(o.year ?? -3661);
  const path = o.path ?? 'career';
  return createInitialState<GameState>(HEALTH, {
    campaignId: 'med',
    branchId: 'b',
    seed: 'med',
    start: { day: d, second: 8 * 3600 },
    character: { name: 'Tal', birthDay: d - 30 * 368, path, archetype: o.archetype ?? (path === 'jedi' ? 'jediGuardian' : 'smuggler'), ...(path === 'jedi' ? { mainFormId: 'soresu', trainingStartAge: 4 } : {}), ...(o.start ? { start: o.start } : {}) } as never,
    ...(o.xp ? { startingXp: Object.fromEntries(Object.entries(o.xp).map(([k, v]) => [k, xpForLevel(v)])) } : {}),
    rank: path === 'jedi' ? 'knight' : 'career',
  });
}
const wound = (over: Partial<Wound> = {}): Wound => ({ id: 'w', part: 'leftArm', severity: 'severe', W: 25, stabilized: false, healProgress: 0, day: dayOf(-3661), source: 'test', ...over });
const withWounds = (s: GameState, ws: Wound[]): GameState => ({ ...s, health: { ...s.health, wounds: ws } });
const engine = (s: GameState, events: object[]) => applyEvents(HEALTH, s, events, { source: 'engine' });
const pass = (s: GameState, days: number): GameState => advanceTime(HEALTH, s, { seconds: days * 86_400, reason: 't', source: 'turnDraft', jump: true }).state;
const charged = (events: readonly GameEvent[]): number => events.filter((e) => e.type === 'creditsCharged').reduce((a, e) => a + Number(e['credits']), 0);

describe('levels of care (spec §2)', () => {
  it('each care level heals at its multiplier; field care does not speed healing', () => {
    expect(CARE_MULT).toEqual({ none: 1, field: 1, facility: 2, kolto: 4, bacta: 5 });
    const w = wound();
    for (const [care, days] of [['none', 21], ['field', 21], ['medical', 10.5], ['kolto', 5.25], ['bacta', 4.2]] as const) expect(baseHealDays(w) / healMultiplier({ care }), care).toBeCloseTo(days);
    // In play: a severe wound under field care heals on day 21 exactly as with none; a facility halves it.
    const s0 = withWounds(fresh(), [wound({ cause: 'blaster' })]);
    const field = engine(s0, [{ type: 'careStarted', kind: 'field', hours: 0 }]).state;
    expect(pass(field, 20).health.wounds).toHaveLength(1);
    expect(pass(field, 21).health.wounds).toHaveLength(0);
    const med = engine(s0, [{ type: 'careStarted', kind: 'medical', hours: 24 * 30 }]).state;
    expect(pass(med, 10).health.wounds).toHaveLength(1);
    expect(pass(med, 11).health.wounds).toHaveLength(0);
  });
  it('a tank heals at once for its hours: bacta beats kolto', () => {
    const s0 = withWounds(fresh(), [wound({ severity: 'critical', W: 40 })]);
    const hours = 24 * 9.5;
    const kolto = engine(s0, [{ type: 'careStarted', kind: 'kolto', hours }]).state;
    const bacta = engine(s0, [{ type: 'careStarted', kind: 'bacta', hours }]).state;
    expect(kolto.health.wounds).toHaveLength(1);
    expect(kolto.health.wounds[0]!.healProgress).toBeCloseTo((9.5 * 4) / HEAL_DAYS.critical);
    expect(bacta.health.wounds).toHaveLength(0);
  });
  it('field care stabilizes the dying (by the Medicine check) and dresses the wounds: no untreated risks', () => {
    let stabilized = 0;
    for (let i = 0; i < 12; i++) {
      const s0 = { ...withWounds(fresh({ xp: { medicine: 60 } }), [wound({ part: 'torso', severity: 'mortal', W: 55 })]) };
      const s = { ...s0, meta: { ...s0.meta, rngState: seedRng(`stab${i}`) }, health: { ...s0.health, dying: { sinceAbs: 0, untilAbs: 1e12 } } };
      const r = applyEvents(REGISTRY, s, [], { source: 'engine' }).state;
      const out = carePlan(r, { source: 'treat' }, null, { dying: true });
      expect(out.report.join(' ')).toMatch(/stabilized only by the Medicine check/);
      const after = engine(r, [{ type: 'woundsStabilized', by: 'a medpac' }]).state;
      if (after.health.wounds[0]!.stabilized) stabilized++;
    }
    expect(stabilized).toBe(12);
    // Field care marks every wound treated and sets a bone; it clears infection.
    const s = engine(withWounds(fresh(), [wound({ cause: 'blade', infected: true }), wound({ id: 'b', depth: 'bone', severity: 'critical', W: 40 })]), [{ type: 'careStarted', kind: 'field', hours: 0 }]).state;
    expect(s.health.wounds.map((w) => [w.treated, w.infected, w.set ?? null, w.care])).toEqual([[true, undefined, null, 'field'], [true, undefined, true, 'field']]);
  });
});

describe('kolto and bacta by date (spec §2)', () => {
  it('bacta is the cheaper fluid in every era; the date changes only which one is rare (Jared, 25 Nov 2026)', () => {
    const mid = { zone: 'mid', place: 'medcenter' as const };
    expect(tankFluid(-3661, undefined, mid)).toBe('kolto');
    expect(tankFluid(-3661, 'bacta', mid)).toBe('kolto');
    expect(tankFluid(-3661, 'bacta', { zone: 'core', place: 'medcenter' })).toBe('bacta');
    expect(tankFluid(-3661, 'bacta', { zone: 'outer', place: 'temple' })).toBe('bacta');
    expect(tankFluid(-19, undefined, mid)).toBe('bacta');
    // After the switch-over kolto is the rare one: only in the Core and at the Temple.
    expect(tankFluid(-19, 'kolto', mid)).toBe('bacta');
    expect(tankFluid(-19, 'kolto', { zone: 'core', place: 'medcenter' })).toBe('kolto');
    expect(tankFluid(-19, 'kolto', { zone: 'outer', place: 'temple' })).toBe('kolto');
    for (const y of [-3661, -2500, -1000, -19, 40]) {
      expect(tankDayPrice(y, 'bacta')).toBeLessThan(tankDayPrice(y, 'kolto'));
      expect([tankDayPrice(y, 'bacta'), tankDayPrice(y, 'kolto')]).toEqual([400, 600]);
    }
    expect(TANK_DAY).toEqual({ bacta: 400, kolto: 600 });
  });
  it('the care plan gives the date\'s tank and charges for it', () => {
    const s = withWounds(fresh(), [wound({ severity: 'critical', W: 40 })]);
    const p = carePlan(s, { source: 'tank', fluid: 'bacta' }, null, { dying: false });
    expect(p.events[0]).toMatchObject({ type: 'careStarted', kind: 'kolto' });
    expect(p.report.join(' ')).toMatch(/bacta is rare here and now: a kolto tank instead/);
    expect(charged(p.events)).toBeGreaterThan(0);
  });
});

describe('untreated wounds (spec §3)', () => {
  const run = (w: Wound, n = 2000): { infected: number; bled: number } => {
    let infected = 0;
    let bled = 0;
    const s = withWounds(fresh(), [w]);
    for (let i = 0; i < n; i++) {
      const r = riskDay(s.health, 'human', w.day + 2, 50, seedRng(`risk${i}`));
      if (r.slice.wounds[0]!.infected) infected++;
      if (r.slice.vitalityLost > 0) bled++;
    }
    return { infected: infected / n, bled: bled / n };
  };
  it('an untreated blade wound can infect, and a severe one bleeds; a blaster wound much less', () => {
    const blade = run(wound({ severity: 'moderate', W: 12, cause: 'blade' }));
    expect(blade.infected).toBeGreaterThan(0.1);
    expect(blade.infected).toBeLessThan(0.2);
    expect(blade.bled).toBe(0);
    const severe = run(wound({ cause: 'slug' }));
    expect(severe.bled).toBe(1);
    const blaster = run(wound({ cause: 'blaster' }));
    expect(blaster.bled).toBe(0);
    expect(blaster.infected).toBeLessThan(blade.infected * 0.3);
    // A species a blaster does not cauterize takes the full risk (the species note); a treated wound none.
    expect(untreatedRiskFactor('blaster', 'x', ['x'])).toBe(1);
    expect(untreatedRiskFactor('blaster', 'human')).toBe(UNTREATED.cauterizedRisk);
    expect(run(wound({ cause: 'blade', treated: true })).infected).toBe(0);
  });
  it('infection slows healing; field care removes the risk and clears it', () => {
    expect(progressHealing(wound({ infected: true }), 1, 1).healProgress).toBeCloseTo(0.5 / 21);
    const s = engine(withWounds(fresh(), [wound({ cause: 'blade', infected: true })]), [{ type: 'careStarted', kind: 'field', hours: 0 }]).state;
    expect(progressHealing(s.health.wounds[0] as Wound, 1, 1).healProgress).toBeCloseTo(1 / 21);
  });
});

describe('wound depth heals without surgery (spec §4)', () => {
  it('a partial cut heals as severe, a severed muscle as critical, both on their own', () => {
    expect(baseHealDays(wound({ severity: 'moderate', W: 12, depth: 'partial' }))).toBe(HEAL_DAYS.severe);
    const muscle = wound({ severity: 'severe', depth: 'muscle' });
    expect(baseHealDays(muscle)).toBe(HEAL_DAYS.critical);
    const s = pass(withWounds(fresh(), [muscle]), HEAL_DAYS.critical);
    expect(s.health.wounds).toHaveLength(0);
  });
  it('a cut to the bone is critical and heals only once set', () => {
    const bone = wound({ severity: 'severe', depth: 'bone' });
    expect(baseHealDays(bone)).toBe(HEAL_DAYS.critical);
    expect(progressHealing(bone, 30, 1).healProgress).toBe(0);
    const set = engine(withWounds(fresh(), [bone]), [{ type: 'careStarted', kind: 'field', hours: 0 }]).state;
    expect(progressHealing(set.health.wounds[0] as Wound, 45, 1).healProgress).toBeCloseTo(1);
  });
});

describe('the treatment roll (spec §5)', () => {
  it('a skilled bacta-tank operator mostly gives clean or scar on a critical wound', () => {
    const sh = outcomeShares('critical', treatmentQuality(50, 'bacta'));
    expect(sh.clean + sh.scar).toBeGreaterThan(0.95);
    let good = 0;
    for (let i = 0; i < 1000; i++) if (['clean', 'scar'].includes(treatmentOutcome('critical', treatmentQuality(50, 'bacta'), (i + 0.5) / 1000))) good++;
    expect(good).toBeGreaterThan(950);
  });
  it('better care never gives worse odds: bacta, then kolto, a facility, field care', () => {
    const bad = (c: 'field' | 'facility' | 'kolto' | 'bacta') => outcomeShares('critical', treatmentQuality(40, c)).lasting;
    expect(bad('bacta')).toBeLessThan(bad('kolto'));
    expect(bad('kolto')).toBeLessThan(bad('facility'));
    expect(bad('facility')).toBeLessThan(bad('field'));
    expect(bad('field')).toBeLessThan(LASTING_CHANCE.critical!);
  });
  it('an untreated wound falls back to the 10 / 35 / 70% baseline', () => {
    for (const [sev, p] of [['severe', 0.1], ['critical', 0.35], ['mortal', 0.7]] as const) {
      let lasting = 0;
      for (let i = 0; i < 1000; i++) if (untreatedOutcome(sev, LASTING_CHANCE[sev]!, (i + 0.5) / 1000) === 'lasting') lasting++;
      expect(lasting / 1000, sev).toBeCloseTo(p, 2);
    }
    // In play: untreated critical wounds healing leave a lasting injury about 35% of the time.
    let n = 0;
    const s = fresh();
    for (let i = 0; i < 400; i++) {
      const r = healAll({ ...s.health, wounds: [wound({ severity: 'critical', W: 40, healProgress: 0.999 })] }, s, (w) => progressHealing(w, 1, 1), seedRng(`h${i}`), 0);
      if (r.slice.lasting.length) n++;
    }
    expect(n / 400).toBeGreaterThan(0.29);
    expect(n / 400).toBeLessThan(0.41);
  });
  it('a minor lasting injury is small: a share of the kind\'s penalty', () => {
    const l: LastingInjury = { id: 'l', kind: 'jointDamage', part: 'leftLeg', adaptation: 0, aid: 'scarTissue', adaptedToday: 0, adaptDay: 0, day: 0 };
    expect(lastingPenaltyOf({ ...l, minor: true }, 'agility')).toBeCloseTo(lastingPenaltyOf(l, 'agility') * 0.3);
  });
});

describe('surgery (spec §6)', () => {
  it('needs a facility and a high Medicine skill', () => {
    expect(surgeryRefusal('field', 90)).toMatch(/facility/);
    expect(surgeryRefusal('medcenter', SURGERY.minOperator - 1)).toMatch(/Medicine/);
    expect(surgeryRefusal('medcenter', SURGERY.minOperator)).toBeNull();
    const s = { ...fresh(), health: { ...fresh().health, lasting: [{ id: 'l', kind: 'lostArm' as const, part: 'rightArm' as const, adaptation: 0, aid: 'none' as const, adaptedToday: 0, adaptDay: 0, day: 0 }] } };
    expect(carePlan(s, { source: 'surgery', at: 'field' }, null, { dying: false }).report[0]).toMatch(/surgery refused/);
    expect(carePlan(s, { source: 'surgery', at: 'ship' }, null, { dying: false }).report[0]).toMatch(/surgery refused/);
  });
  it('success gives the full benefit, a miss a weaker result, a bad miss a worse one', () => {
    expect(surgeryRoll('prosthetic', 70, 0.5).result).toBe('success');
    expect(surgeryRoll('internal', 50, 0.4).result).toBe('weaker');
    expect(surgeryRoll('internal', 50, 0).result).toBe('worse');
    const base = fresh();
    const s = { ...base, health: { ...base.health, lasting: [{ id: 'l', kind: 'lostArm' as const, part: 'rightArm' as const, adaptation: 0, aid: 'none' as const, adaptedToday: 0, adaptDay: 0, day: 0 }] } };
    const fit = (result: string) => engine(s, [{ type: 'surgeryDone', procedure: 'prosthetic', result, aid: 'qualityCybernetic', operator: 60 }]).state.health;
    expect(fit('success').lasting[0]).toMatchObject({ aid: 'qualityCybernetic' });
    expect(fit('success').lasting[0]!.aidCondition).toBeUndefined();
    expect(fit('weaker').lasting[0]).toMatchObject({ aid: 'basicProsthetic', aidCondition: 'damaged' });
    expect(fit('worse').lasting[0]).toMatchObject({ aid: 'none' });
    expect(fit('worse').wounds).toHaveLength(1);
    // Internal: success heals as a band lighter; extract clears a toxin and shrapnel.
    const inj = engine(withWounds(base, [wound({ part: 'torso', severity: 'critical', W: 40 })]), [{ type: 'surgeryDone', procedure: 'internal', result: 'success', operator: 60 }]).state;
    expect(baseHealDays(inj.health.wounds[0] as Wound)).toBe(HEAL_DAYS.severe);
    const ex = engine(withWounds(base, [wound({ toxin: 'venom', fragments: true })]), [{ type: 'surgeryDone', procedure: 'extract', result: 'success', operator: 60 }]).state;
    expect([ex.health.wounds[0]!.toxin, ex.health.wounds[0]!.fragments]).toEqual([undefined, undefined]);
  });
});

describe('prosthetics (spec §7)', () => {
  it('a hit on a prosthetic becomes equipment damage', () => {
    expect([aidHit(5, undefined), aidHit(12, undefined), aidHit(12, 'damaged'), aidHit(25, undefined)]).toEqual([undefined, 'damaged', 'broken', 'broken']);
    const arm: LastingInjury = { id: 'l', kind: 'lostArm', part: 'leftArm', adaptation: 0.8, aid: 'qualityCybernetic', adaptedToday: 0, adaptDay: 0, day: 0 };
    const f = { ...forceUser('D', 50), lasting: [arm], armor: 'none' as const };
    const d = damageFighter(f, 'critical', 25, 'blasterRifle', REAL, seedRng('p'), 0, 1, false, 'leftArm');
    expect(d.hit.prosthetic).toBe(true);
    expect(d.f.wounds).toHaveLength(0);
    expect(d.f.lasting[0]!.aidCondition).toBe('broken');
    // Damaged: half its adaptation counts; broken: none, and the limb counts as missing until repaired at a facility.
    expect(lastingPenaltyOf({ ...arm, aidCondition: 'damaged' }, 'soresu')).toBeCloseTo(0.4 * (1 - 0.4));
    expect(lastingPenaltyOf({ ...arm, aidCondition: 'broken' }, 'soresu')).toBeCloseTo(0.4);
    const s0 = fresh();
    const s = engine({ ...s0, health: { ...s0.health, lasting: [arm] } }, [{ type: 'prostheticDamaged', part: 'leftArm', condition: 'broken' }]).state;
    const plan = carePlan(s, { source: 'admit' }, 24, { dying: false });
    expect(plan.events.map((e) => e.type)).toEqual(['prostheticRepaired', 'creditsCharged']);
    expect(engine(s, plan.events.slice(0, 1)).state.health.lasting[0]!.aidCondition).toBeUndefined();
  });
});

describe('toxins (spec §8)', () => {
  it('a poisoned wound does not heal and drains Vitality until purged', () => {
    const w = wound({ toxin: 'venom', cause: 'claw', treated: true });
    expect(progressHealing(w, 10, 1).healProgress).toBe(0);
    const r = riskDay(withWounds(fresh(), [w]).health, 'human', w.day + 1, 50, seedRng('t'));
    expect(r.slice.vitalityLost).toBeCloseTo(10);
  });
  it('an antidote or a Force purge clears it', () => {
    const s = withWounds(fresh(), [wound({ toxin: 'dart' })]);
    const anti = carePlan(s, { source: 'antidote' }, null, { dying: false });
    expect(anti.events[0]).toMatchObject({ type: 'toxinsPurged' });
    expect(engine(s, anti.events.slice(0, 1)).state.health.wounds[0]!.toxin).toBeUndefined();
    const jedi = withWounds(fresh({ path: 'jedi', xp: { forceHealSelf: 20, meditation: 30 } }), [wound({ toxin: 'poison' })]);
    const purge = carePlan(jedi, { source: 'forceHealer' }, null, { dying: false });
    expect(purge.events.map((e) => e.type)).toEqual(['careStarted', 'toxinsPurged']);
    const weak = withWounds(fresh({ path: 'jedi', xp: { forceHealSelf: 5, meditation: 30 } }), [wound({ toxin: 'poison' })]);
    expect(carePlan(weak, { source: 'forceHealer' }, null, { dying: false }).events.map((e) => e.type)).toEqual(['careStarted']);
  });
  it('a poison hazard leaves its toxin in the wound', () => {
    let found = false;
    for (let i = 0; i < 10 && !found; i++) {
      const s0 = fresh();
      const s = engine({ ...s0, meta: { ...s0.meta, rngState: seedRng(`poison${i}`) } }, [{ type: 'hazardResolved', hazard: 'poison', severity: 3, cause: 'a dart' }]).state;
      if (s.health.wounds.length) found = s.health.wounds[0]!.toxin === 'poison';
    }
    expect(found).toBe(true);
  });
});

describe('cost and access (spec §9)', () => {
  it('Jedi with the Temple healers and soldiers in military medbays are treated free; everyone else pays', () => {
    expect([careIsFree('temple', { jedi: true, soldier: false }), careIsFree('military', { jedi: false, soldier: true }), careIsFree('temple', { jedi: false, soldier: true }), careIsFree('medcenter', { jedi: true, soldier: true })]).toEqual([true, true, false, false]);
    const hurt = [wound({ severity: 'critical', W: 40 })];
    const jedi = withWounds(fresh({ path: 'jedi' }), hurt);
    expect(charged(carePlan(jedi, { source: 'tank', at: 'temple' }, null, { dying: false }).events)).toBe(0);
    expect(charged(carePlan(jedi, { source: 'admit', at: 'medcenter' }, 24 * 3, { dying: false }).events)).toBeGreaterThan(0);
    const trooper = withWounds(fresh({ archetype: 'soldier', start: { optionId: 'republic-trooper', faction: 'republic', imperialBorn: false } }), hurt);
    expect(trooper.economy.job.kind).toBe('military');
    expect(charged(carePlan(trooper, { source: 'admit', at: 'military' }, 24 * 3, { dying: false }).events)).toBe(0);
    const smuggler = withWounds(fresh(), hurt);
    const bill = carePlan(smuggler, { source: 'admit', at: 'medcenter' }, 24 * 3, { dying: false }).events;
    expect(charged(bill)).toBeGreaterThan(0);
    // The economy charges it: the wallet pays, a shortfall is owed to a bank.
    const paid = applyEvents(HEALTH, { ...smuggler, economy: { ...smuggler.economy, wallet: { republic: 100_000, imperial: 0, hutt: 0 } } }, bill, { source: 'engine' }).state;
    expect(paid.economy.wallet.republic).toBe(100_000 - charged(bill));
  });
});

describe('the run\'s other items (J)', () => {
  it('Krayt is an apex duelist, not beyond any duelist (lore rulings 25 Nov, item 2)', () => {
    expect([duelistBar('lore:darth-krayt', 130), duelistBar('lore:darth-krayt', 138)]).toEqual(['apex', 'apex']);
    expect(duelistBar('lore:abeloth', 44)).toBe('beyond');
  });
  it('Luke\'s line: a smooth curve through his three sheets, apex from 25 ABY', () => {
    const luke = CANON_BY_ID.get('lore:luke-skywalker')!;
    const at = (aby: number) => canonFigureLevelsAt(luke, -aby, absDayFromDate({ year: aby, month: 1, day: 1 }));
    const main = (l: Readonly<Record<string, number>>) => Math.max(...FORM_IDS.map((f) => l[f] ?? 0));
    const years = [4, 10, 17, 25, 36, 44];
    const lines = years.map(at);
    for (let i = 1; i < lines.length; i++) for (const k of ['forceControl', 'forceOutput', 'willpower']) expect(lines[i]![k]!, `${k} ${years[i]}`).toBeGreaterThanOrEqual(lines[i - 1]![k]!);
    expect(main(lines[0]!)).toBe(82);
    expect([lines[3]!['djemSo'], lines[3]!['forceControl'], lines[3]!['willpower']]).toEqual([100, 120, 105]);
    for (const aby of [25, 30, 36, 40, 44]) {
      const l = at(aby);
      expect(main(l), `combat ${aby}`).toBeGreaterThanOrEqual(TIER_LEVELS.apex.combat);
      expect(l['forceControl']!, `FC ${aby}`).toBeGreaterThanOrEqual(TIER_LEVELS.apex.forceControl);
      expect(l['willpower']!, `WP ${aby}`).toBeGreaterThanOrEqual(TIER_LEVELS.apex.willpower);
    }
    expect([duelistBar('lore:luke-skywalker', 10), duelistBar('lore:luke-skywalker', 25), duelistBar('lore:luke-skywalker', 44)]).toEqual(['top', 'apex', 'apex']);
  });
  it('Vrath Xizor is a sniper: Blaster 47 in 3,653 (the soldier gave 38); still short of Master', () => {
    const x = CANON_BY_ID.get('lore:vrath-xizor')!;
    expect(x.archetype).toBe('sniper');
    const b = canonFigureLevelsAt(x, 3653, absDayFromDate({ year: -3653, month: 1, day: 1 }))['blaster']!;
    const soldier = canonFigureLevelsAt({ ...x, archetype: 'soldier' }, 3653, absDayFromDate({ year: -3653, month: 1, day: 1 }))['blaster']!;
    expect(b).toBeGreaterThan(soldier + 8);
    expect(b).toBeLessThan(61);
  });
});

describe('Jedi wealth (Jared, D-511)', () => {
  const ai = (s: GameState, events: object[]) => applyEvents(HEALTH, s, events, { source: 'ai' });
  const jedi = (republic: number) => {
    const s = fresh({ path: 'jedi' });
    return { ...s, economy: { ...s.economy, wallet: { republic, imperial: 0, hutt: 0 } } };
  };
  it('only personal holdings over 25,000 cr count', () => {
    expect(JEDI_MONEY.wealth).toBe(25_000);
    const under = ai(jedi(24_000), [{ type: 'trade', dir: 'buy', item: 'fine clothes' }]).state;
    expect(under.flags.set).not.toContain('jediWealth');
    const over = ai(jedi(26_000), [{ type: 'trade', dir: 'buy', item: 'fine clothes' }]).state;
    expect(over.flags.set).toContain('jediWealth');
  });
  it('issued gear, mission funds and a droid taken in play never count', () => {
    let s = ai(jedi(5_000), [{ type: 'trade', dir: 'issue', item: 'a medpac' }]).state;
    expect(s.economy.possessions).toBe(0);
    s = ai(s, [{ type: 'trade', dir: 'buy', item: 'an astromech droid' }]).state;
    expect(s.economy.possessions).toBe(0);
    const funded = { ...jedi(0), economy: { ...jedi(0).economy, orderFunds: 50_000 } };
    expect(ai(funded, [{ type: 'trade', dir: 'buy', item: 'a landspeeder' }]).state.economy.possessions).toBe(0);
  });
});
