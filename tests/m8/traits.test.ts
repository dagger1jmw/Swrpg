// Starting traits and formative events (M8 checklist item 16; docs-v2/spec/traits.md section 11), and the m8-skills review
// fixes (Part A: the field agent and officer paces, Tavus and Rusk, the drafts as anchors).
import { describe, expect, it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { CANON_TRAITS } from '../../src/data/canon/canonTraits';
import { SKILL_DRAFTS } from '../../src/data/canon/skillDrafts';
import { FORMATIVE_EVENTS, FORMATIVE_EVENT_BY_ID, QUIZ_LIMITS } from '../../src/data/formativeEvents';
import { TRAITS, TRAIT_BY_ID, TRAIT_LIMITS } from '../../src/data/traits';
import { absDayFromDate } from '../../src/engine/calendar';
import { M_CAP } from '../../src/data/progression.config';
import { speedM } from '../../src/engine/speed';
import { duelTier } from '../../src/engine/who';
import { styleEdge } from '../../src/engine/martialStyles';
import { buildPlayerFighter, traitEdges } from '../../src/features/combat/build';
import { selectFlags } from '../../src/features/flags/selectors';
import { selectNpcs } from '../../src/features/npcs/selectors';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';
import { speedPartsFor } from '../../src/features/progression/training';
import { selectStanding } from '../../src/features/ranks/selectors';
import {
  answerEffects,
  backstoryLeans,
  eligibleTraits,
  generatedNpcTraits,
  isYounglingStart,
  quizPlan,
  scoreQuiz,
  suggestTraits,
  traitChoiceErrors,
  traitLearning,
  traitPressure,
  traitReaction,
  traitRefusal,
  traitRollMod,
  type QuizInput,
  type TraitContext,
  type TraitHolding,
} from '../../src/features/traits/rules';
import { selectCheckTraitMod, selectQuizPlan, selectTraitLines } from '../../src/features/traits/selectors';
import { traitsFeature } from '../../src/features/traits';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { createMemoryStorage } from '../../src/persist/storage';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, creationQuizInput, quizDeferred, validateNewCampaign, type NewCampaignInput } from '../../src/turn/campaign';
import { stateBlock } from '../../src/turn/context';
import { makeEstimator } from '../../src/ai/tokenRatio';

const day = (bby: number): number => absDayFromDate({ year: -bby, month: 1, day: 1 });
const holds = (...ids: string[]): TraitHolding[] => ids.map((id) => ({ id, since: 0, source: 'creation' as const }));
const jediCtx = (o: Partial<TraitContext> = {}): TraitContext => ({ path: 'jedi', speciesId: 'human', archetype: 'jediGuardian', birthYear: -3685, startYear: -3661, trainingStartAge: 4, ...o });

function jediInput(o: { name?: string; age?: number; startBby?: number; rank?: string; start?: number; warYears?: number; traits?: NewCampaignInput['traits']; formative?: NewCampaignInput['formative'] } = {}): NewCampaignInput {
  const startBby = o.startBby ?? 3661;
  const age = o.age ?? 24;
  return {
    name: o.name ?? 'Tal Ressan',
    birthDate: { year: -(startBby + age), month: 1, day: 1 },
    startDate: { year: -startBby, month: 1, day: 1 },
    startSecond: 7 * 3600,
    creation: { speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: o.rank ?? 'knight', trainingStartAge: o.start ?? 4, talents: {}, dominantHand: 'right', ...(o.warYears ? { warYears: o.warYears } : {}) },
    ...(o.traits !== undefined ? { traits: o.traits } : { traits: { origin: 'templeRaised', temperament: 'patient', scarOrTie: 'rival' } }),
    ...(o.formative !== undefined ? { formative: o.formative } : {}),
  };
}

/** Answers the first choice of every scene. */
const firstAnswers = (q: QuizInput) => quizPlan(q).events.map((id) => ({ eventId: id, choiceId: FORMATIVE_EVENT_BY_ID.get(id)!.choices[0]!.id }));

describe('the catalog (44 traits) and the pool', () => {
  it('has 12 origins, 14 temperaments, 10 scars and 8 ties; every hook inside the band', () => {
    const count = (k: string) => TRAITS.filter((t) => t.kind === k).length;
    expect([count('origin'), count('temperament'), count('scar'), count('tie')]).toEqual([12, 14, 10, 8]);
    for (const t of TRAITS) {
      for (const r of t.rolls ?? []) expect(Math.abs(r.mod), t.id).toBeLessThanOrEqual(2);
      for (const l of t.learning ?? []) {
        expect(l.factor, t.id).toBeGreaterThanOrEqual(0.8);
        expect(l.factor, t.id).toBeLessThanOrEqual(1.2);
      }
      for (const r of t.reactions ?? []) expect(Math.abs(r.shift), t.id).toBeLessThanOrEqual(2);
    }
  });
  it('has the five sets: Initiate 9, Padawan 10, Sith 9, military 9, civilian 13', () => {
    const n = (sets: string[]) => FORMATIVE_EVENTS.filter((e) => sets.includes(e.set)).length;
    expect([n(['initiate']), n(['padawan']), n(['sith']), n(['military']), n(['street', 'noble', 'spacer', 'anyone'])]).toEqual([9, 10, 9, 9, 13]);
    for (const e of FORMATIVE_EVENTS) {
      expect(e.choices.length, e.id).toBeGreaterThanOrEqual(3);
      expect(e.choices.length, e.id).toBeLessThanOrEqual(4);
    }
  });
  it('no answer gives a stat or a skill; nudges stay within +-2 after the clamp; every leaning and scar is a trait', () => {
    for (const e of FORMATIVE_EVENTS)
      for (const c of e.choices) {
        expect(Object.keys(c).filter((k) => !['id', 'label', 'leans', 'align', 'dark', 'standing', 'flag', 'person', 'scar', 'fact', 'roll'].includes(k)), `${e.id}.${c.id}`).toEqual([]);
        for (const id of [...(c.leans ?? []), ...(c.scar ? [c.scar] : []), ...(c.person?.tie ? [c.person.tie] : [])]) expect(TRAIT_BY_ID.has(id), `${e.id}.${c.id}: ${id}`).toBe(true);
      }
  });
});

describe('creation: one origin, one temperament, one scar or tie; a fourth only if flaw-heavy', () => {
  const ctx = jediCtx();
  it('accepts a full set and refuses a missing slot', () => {
    expect(traitChoiceErrors({ origin: 'templeRaised', temperament: 'patient', scarOrTie: 'rival' }, ctx)).toEqual([]);
    expect(traitChoiceErrors({ origin: 'patient', temperament: 'patient', scarOrTie: 'rival' }, ctx).join(' ')).toMatch(/one origin/);
    expect(traitChoiceErrors({ origin: 'templeRaised', temperament: 'rival', scarOrTie: 'rival' }, ctx).join(' ')).toMatch(/one temperament/);
    expect(traitChoiceErrors({ origin: 'templeRaised', temperament: 'patient', scarOrTie: 'curious' }, ctx).join(' ')).toMatch(/scar or tie/);
  });
  it('a fourth must be flaw-heavy', () => {
    expect(traitChoiceErrors({ origin: 'templeRaised', temperament: 'patient', scarOrTie: 'rival', fourth: 'proud' }, ctx)).toEqual([]);
    expect(traitChoiceErrors({ origin: 'templeRaised', temperament: 'patient', scarOrTie: 'rival', fourth: 'curious' }, ctx).join(' ')).toMatch(/flaw-heavy/);
  });
  it('validateNewCampaign refuses a bad set', () => {
    expect(validateNewCampaign(jediInput({ traits: { origin: 'templeRaised', temperament: 'patient', scarOrTie: 'curious' } })).join(' ')).toMatch(/scar or tie/);
  });
});

describe('gates', () => {
  it('Temple-raised needs arrival before 10; arriving at 10 takes an ordinary origin', () => {
    expect(traitRefusal('templeRaised', jediCtx({ trainingStartAge: 9.5 }))).toBeNull();
    expect(traitRefusal('templeRaised', jediCtx({ trainingStartAge: 10 }))).toMatch(/before age 10/);
    expect(traitRefusal('frontierWorld', jediCtx({ trainingStartAge: 10 }))).toBeNull();
    expect(traitRefusal('templeRaised', { ...jediCtx(), path: 'career', archetype: 'soldier' })).toMatch(/only for jedi/);
  });
  it('the Sacking of Coruscant: a massacre survivor only if alive there in 3,653', () => {
    // A Jedi at the Temple in 3,653 (born 3,670, there from 4) starting in 3,640.
    expect(traitRefusal('massacreSurvivor', jediCtx({ birthYear: -3670, startYear: -3640 }))).toBeNull();
    // Born after the Sacking, or starting before it: closed.
    expect(traitRefusal('massacreSurvivor', jediCtx({ birthYear: -3650, startYear: -3630 }))).not.toBeNull();
    expect(traitRefusal('massacreSurvivor', jediCtx({ birthYear: -3685, startYear: -3661 }))).not.toBeNull();
    // A career on Coruscant (underlevels) in 3,653; elsewhere, closed.
    const career: TraitContext = { path: 'career', speciesId: 'human', archetype: 'soldier', birthYear: -3670, startYear: -3640, trainingStartAge: 18 };
    expect(traitRefusal('massacreSurvivor', { ...career, origin: 'underlevels' })).toBeNull();
    expect(traitRefusal('massacreSurvivor', { ...career, origin: 'frontierWorld' })).not.toBeNull();
    expect(traitRefusal('massacreSurvivor', { ...career, origin: 'frontierWorld', homeworld: 'Coruscant' })).toBeNull();
  });
  it('Order 66 opens the scar for a Jedi of 19 BBY; war veteran needs war years', () => {
    expect(traitRefusal('massacreSurvivor', jediCtx({ birthYear: -35, startYear: -10 }))).toBeNull();
    // m8-fixes D1 (Jared): war years above 0, even in the Great War's years (the form's own number decides).
    expect(traitRefusal('warVeteran', jediCtx({ birthYear: -3685, startYear: -3661 }))).toMatch(/war years above 0/);
    expect(traitRefusal('warVeteran', jediCtx({ birthYear: -3685, startYear: -3661, warYears: 1 }))).toBeNull(); // the Great War
    expect(traitRefusal('warVeteran', jediCtx({ birthYear: -3630, startYear: -3600 }))).not.toBeNull(); // peace
    expect(traitRefusal('warVeteran', jediCtx({ birthYear: -3630, startYear: -3600, warYears: 2 }))).toBeNull();
  });
  it('Imperial-born and Academy-raised by side; the Forbidden bond only for Jedi', () => {
    const sith: TraitContext = { path: 'sith', speciesId: 'sithPureblood', archetype: 'sithWarrior', birthYear: -3680, startYear: -3661, trainingStartAge: 9 };
    expect(traitRefusal('imperialBorn', sith)).toBeNull();
    expect(traitRefusal('academyRaised', sith)).toBeNull();
    expect(traitRefusal('academyRaised', jediCtx())).not.toBeNull();
    expect(traitRefusal('imperialBorn', jediCtx())).not.toBeNull();
    expect(traitRefusal('forbiddenBond', jediCtx())).toBeNull();
    expect(traitRefusal('forbiddenBond', sith)).not.toBeNull();
    expect(eligibleTraits(jediCtx(), 'origin').map((t) => t.id)).toContain('templeRaised');
  });
});

describe('weight: +-2 on rolls, +-20% learning, reactions; never the duel tiers or the 4.0x cap', () => {
  it('roll hooks add up but stay within +-2', () => {
    expect(traitRollMod(holds('stubborn'), ['persuasion']).total).toBe(2);
    expect(traitRollMod(holds('hotHeaded'), ['provocation']).total).toBe(-2);
    expect(traitRollMod(holds('slaveBorn', 'formerPrisoner', 'disasterSurvivor'), ['pain']).total).toBe(2); // 2 + 1 + 1, held to 2
    expect(traitRollMod(holds('patient'), ['ambush']).total).toBe(0);
  });
  it('learning factors stay within 0.8-1.2, even stacked', () => {
    expect(traitLearning(holds('curious'), 'investigation')).toBeCloseTo(1.12, 6);
    expect(traitLearning(holds('spacerBorn'), 'piloting')).toBeCloseTo(1.1, 6);
    expect(traitLearning(holds('ambitious', 'disgraced'), 'tactics', { play: true, rivalSpur: true })).toBeLessThanOrEqual(TRAIT_LIMITS.learnMax);
    expect(traitLearning(holds('ambitious'), 'tactics')).toBe(1); // deeds only
  });
  it('reactions shift with kinds of NPC, at most +-2', () => {
    expect(traitReaction(holds('nobleHouse'), ['elite'])).toBe(2);
    expect(traitReaction(holds('templeRaised', 'underlevels'), ['criminal'])).toBe(-1);
    expect(traitReaction(holds('criminalFamily', 'slaveBorn'), ['law', 'slaver'])).toBe(-2);
  });
  it('M keeps its 2.8 cap with a trait factor in it', () => {
    expect(speedM({ talent: 2, crossTalent: 1, instruction: 1.4, age: 1, state: 1, alignment: 1, species: 1, traits: 1.2 }).m).toBe(M_CAP);
  });
  it('the trait factor reaches training but not the duel tier', () => {
    const s = campaignState({ traits: { origin: 'templeRaised', temperament: 'curious', scarOrTie: 'rival' } });
    expect(speedPartsFor(s, 1)('investigation')!.traits).toBeCloseTo(1.12, 6);
    const f = buildPlayerFighter(s);
    const plain = buildPlayerFighter(campaignState({ traits: undefined }));
    const tierOf = (level: number) => duelTier({ forceUser: true, masterRank: false, meetsMasterSkills: false, combat: level, forceControl: 50, willpower: 50 });
    expect(tierOf(f.level)).toBe(tierOf(plain.level));
    expect(f.level).toBe(plain.level);
  });
  it('combat edges are roll modifiers held to +-2 (never the level)', () => {
    expect(traitEdges(holds('hotHeaded'))).toEqual({ pressAttack: 1, defence: 0, suddenStart: 0, taunt: -2 });
    expect(traitEdges(holds('reckless'))?.defence).toBe(-1);
    expect(traitEdges(holds('curious'))).toBeNull();
  });
});

describe('alignment hooks (for M6)', () => {
  it('Ambitious gives no dark pressure by itself', () => {
    const p = traitPressure(holds('ambitious'));
    expect(p).toEqual(traitPressure([]));
    expect(TRAIT_BY_ID.get('ambitious')!.pressure).toBeUndefined();
  });
  it('Attached family raises attachment; Compassionate eases dark pressure from mercy; Brush with the dark starts higher', () => {
    expect(traitPressure(holds('familyTie')).attachment).toBeGreaterThan(1);
    expect(traitPressure(holds('compassionate')).mercyEase).toBeLessThan(1);
    expect(traitPressure(holds('brushWithDark')).startDarkPressure).toBeGreaterThan(0);
    expect(traitPressure(holds('hotHeaded')).angerDark).toBeGreaterThan(1);
  });
});

function campaignState(o: NonNullable<Parameters<typeof jediInput>[0]>): GameState {
  // createCampaign is async (storage); the state it builds is the same as the synchronous path below, so the tests that
  // need only the state use the async helper's result through a cache.
  const key = JSON.stringify(o);
  const hit = CACHE.get(key);
  if (!hit) throw new Error(`campaign ${key} not prepared`);
  return hit;
}
const CACHE = new Map<string, GameState>();
async function prepare(o: NonNullable<Parameters<typeof jediInput>[0]>, formative?: NewCampaignInput['formative']): Promise<GameState> {
  const input = { ...jediInput(o), ...(formative ? { formative } : {}) };
  if (o.traits === undefined && 'traits' in o) delete (input as { traits?: unknown }).traits;
  const s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${CACHE.size}`, branchId: 'b' }, 'x')).state;
  CACHE.set(JSON.stringify(o), s);
  return s;
}
await prepare({ traits: { origin: 'templeRaised', temperament: 'curious', scarOrTie: 'rival' } });
await prepare({ traits: undefined });

describe('the formative quiz', () => {
  it('runs at creation for an older start: 4-8 scenes fitting path, age and date', () => {
    const input = jediInput({ age: 24 });
    expect(quizDeferred(input)).toBe(false);
    const q = creationQuizInput(input)!;
    const plan = quizPlan(q);
    expect(plan.events.length).toBeGreaterThanOrEqual(QUIZ_LIMITS.minScenes);
    expect(plan.events.length).toBeLessThanOrEqual(QUIZ_LIMITS.maxScenes);
    for (const id of plan.events) expect(['initiate', 'padawan']).toContain(FORMATIVE_EVENT_BY_ID.get(id)!.set);
    // 3,685-3,661: the Padawan years fall in the Great War, so the first battle is drawn.
    expect(plan.events).toContain('pad.firstBattle');
    // Not on Coruscant in 3,653 (the start is 3,661): no Sacking.
    expect(plan.events).not.toContain('init.sacking');
  });
  it('draws the Sacking for a youngling who lived it, and the right sets for Sith, military and civilian', () => {
    const base = { fromAge: 0, birthYear: -3663, origin: 'templeRaised', forceSensitive: true, atCoruscant3653: true, seed: 's' };
    expect(quizPlan({ ...base, track: 'jedi', toAge: 14 }).events).toContain('init.sacking');
    const sith = quizPlan({ ...base, track: 'sith', toAge: 18, origin: 'academyRaised', atCoruscant3653: false });
    expect(sith.events.every((id) => FORMATIVE_EVENT_BY_ID.get(id)!.set === 'sith')).toBe(true);
    const mil = quizPlan({ ...base, track: 'military', toAge: 20, origin: 'militaryFamily', forceSensitive: false, atCoruscant3653: false });
    expect(mil.events.some((id) => FORMATIVE_EVENT_BY_ID.get(id)!.set === 'military')).toBe(true);
    const street = quizPlan({ ...base, track: 'civilian', toAge: 18, origin: 'underlevels', forceSensitive: false, atCoruscant3653: false });
    expect(street.events.every((id) => ['street', 'anyone'].includes(FORMATIVE_EVENT_BY_ID.get(id)!.set))).toBe(true);
    expect(street.events).not.toContain('civ.forceMoment');
    for (const p of [sith, mil, street]) {
      expect(p.events.length).toBeGreaterThanOrEqual(4);
      expect(p.events.length).toBeLessThanOrEqual(8);
    }
  });
  it('the same inputs draw the same scenes', () => {
    const q = creationQuizInput(jediInput())!;
    expect(quizPlan(q)).toEqual(quizPlan({ ...q }));
  });
  it('answers give facts, leanings, people, standing and nudges within +-2 an event and +-10 overall', () => {
    // Every dark choice at once: the nudges are clamped.
    const dark = FORMATIVE_EVENTS.flatMap((e) => e.choices.filter((c) => (c.align ?? 0) < 0).map((c) => ({ eventId: e.id, choiceId: c.id })));
    const r = scoreQuiz(dark, 'seed');
    expect(r.align).toBeGreaterThanOrEqual(-10);
    expect(r.dark).toBeLessThanOrEqual(10);
    for (const a of dark) {
      const e = FORMATIVE_EVENT_BY_ID.get(a.eventId)!;
      const one = scoreQuiz([a], 'seed');
      expect(Math.abs(one.align), a.eventId).toBeLessThanOrEqual(2);
      expect(Math.abs(one.dark), a.eventId).toBeLessThanOrEqual(2);
      expect(one.facts.length).toBe(1);
      void e;
    }
    const prank = scoreQuiz([{ eventId: 'init.prank', choiceId: 'report' }], 'seed');
    expect(prank.standing.order).toBe(1);
    expect(prank.people[0]).toMatchObject({ bond: expect.any(Number), tie: 'rival' });
    expect(prank.leans['disciplined']).toBe(1);
  });
  it('rolls are made from the seed, the same every time', () => {
    const e = FORMATIVE_EVENT_BY_ID.get('init.prank')!;
    const c = e.choices.find((x) => x.id === 'join')!;
    expect(answerEffects(e, c, 'a')).toEqual(answerEffects(e, c, 'a'));
  });
  it('suggests traits from the leanings; "suggest from my backstory" works without a quiz', () => {
    const s = suggestTraits({ disciplined: 3, curious: 1, rival: 2 }, jediCtx(), 'templeRaised');
    expect(s.temperament).toBe('disciplined');
    expect(s.scarOrTie).toBe('rival');
    expect(backstoryLeans(jediCtx())['templeRaised']).toBeGreaterThan(0);
  });
  it('at creation it applies once: facts, people, standing; then never again', async () => {
    const input = jediInput({ name: 'Quiz One' });
    const q = creationQuizInput(input)!;
    const answers = firstAnswers(q);
    const s = (await createCampaign(REGISTRY, createMemoryStorage(), { ...input, formative: { answers } }, { campaignId: 'quiz1', branchId: 'b' }, 'x')).state;
    expect(s.traits.quiz.status).toBe('taken');
    expect(s.memory.facts.length).toBeGreaterThan(answers.length - 1);
    expect(Math.abs(s.traits.alignmentNudge)).toBeLessThanOrEqual(10);
    const again = applyEvents(REGISTRY, s, [{ type: 'formativeQuizTaken', answers }], { source: 'player' });
    expect(again.rejected[0]?.reason).toMatch(/never taken again/);
  });
  it('a youngling start waits for the first long skip, covers the skipped years, and comes once', async () => {
    const input = jediInput({ name: 'Young One', age: 8, rank: 'initiate', start: 4 });
    expect(quizDeferred(input)).toBe(true);
    expect(isYounglingStart('jedi', 'initiate', 8)).toBe(true);
    let s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'young', branchId: 'b' }, 'x')).state;
    expect(s.traits.quiz.status).toBe('pending');
    // A short skip does nothing.
    s = advanceTime(REGISTRY, s, { seconds: 30 * 86400, reason: 'montage', source: 'turnDraft', jump: true }).state;
    expect(s.traits.quiz.status).toBe('pending');
    // A skip of years (resumed after any interruption, as the player would): due, covering the skipped years from 8.
    for (let i = 0; i < 12 && s.traits.quiz.status === 'pending'; i++) s = advanceTime(REGISTRY, s, { seconds: 2 * 368 * 86400, reason: 'skip', source: 'turnDraft', jump: true }).state;
    expect(s.traits.quiz.status).toBe('due');
    expect(s.traits.quiz.fromAge).toBeCloseTo(8, 0);
    expect(s.traits.quiz.toAge!).toBeGreaterThan(9);
    const plan = selectQuizPlan(s)!;
    expect(plan.events.length).toBeGreaterThanOrEqual(4);
    expect(plan.events.length).toBeLessThanOrEqual(8);
    const answers = plan.events.map((id) => ({ eventId: id, choiceId: FORMATIVE_EVENT_BY_ID.get(id)!.choices[0]!.id }));
    const r = applyEvents(REGISTRY, s, [{ type: 'formativeQuizTaken', answers }], { source: 'player' });
    expect(r.rejected).toEqual([]);
    expect(r.state.traits.quiz.status).toBe('taken');
    // Never again, even after another long skip.
    const later = advanceTime(REGISTRY, r.state, { seconds: 2 * 368 * 86400, reason: 'skip', source: 'turnDraft', jump: true }).state;
    expect(later.traits.quiz.status).toBe('taken');
  });
  it('a quiz person becomes an NPC with a bond, without Charisma XP', async () => {
    const input = jediInput({ name: 'Bond One' });
    const q = creationQuizInput(input)!;
    const plan = quizPlan(q);
    const answers = plan.events.map((id) => {
      const e = FORMATIVE_EVENT_BY_ID.get(id)!;
      const withPerson = e.choices.find((c) => c.person) ?? e.choices[0]!;
      return { eventId: id, choiceId: withPerson.id };
    });
    const s = (await createCampaign(REGISTRY, createMemoryStorage(), { ...input, formative: { answers } }, { campaignId: 'bond1', branchId: 'b' }, 'x')).state;
    const people = scoreQuiz(answers, s.traits.quiz.seed).people;
    expect(people.length).toBeGreaterThan(0);
    expect(Object.keys(s.relationships.byNpcId).length).toBeGreaterThanOrEqual(people.length);
    expect(s.progression.skills['charisma']?.xp ?? 0).toBe(campaignState({ traits: undefined }).progression.skills['charisma']?.xp ?? 0);
  });
  it('flags record knowing of a technique, never the power', async () => {
    const input = jediInput({ name: 'Flag One' });
    const plan = quizPlan(creationQuizInput(input)!);
    const answers = plan.events.map((id) => ({ eventId: id, choiceId: id === 'init.forbiddenText' ? 'try' : FORMATIVE_EVENT_BY_ID.get(id)!.choices[0]!.id }));
    const s = (await createCampaign(REGISTRY, createMemoryStorage(), { ...input, formative: { answers } }, { campaignId: 'flag1', branchId: 'b' }, 'x')).state;
    if (plan.events.includes('init.forbiddenText')) expect(selectFlags(s)).toContain('knowsOfTechnique:choke');
    expect(s.progression.skills['forceChoke']?.xp ?? 0).toBe(0);
  });
});

describe('change in play: only recorded events', () => {
  it('a fear faced three times is overcome; a massacre adds a scar; a tie ends when the person dies', async () => {
    const s0 = await prepare({ name: 'Change One', warYears: 2, traits: { origin: 'frontierWorld', temperament: 'hotHeaded', scarOrTie: 'warVeteran' } });
    let s = s0;
    for (let i = 0; i < 2; i++) s = applyEvents(REGISTRY, s, [{ type: 'traitMoment', moment: 'fearFaced', traitId: 'warVeteran' }], { source: 'ai' }).state;
    expect(s.traits.held.find((h) => h.id === 'warVeteran')!.overcome).toBeUndefined();
    s = applyEvents(REGISTRY, s, [{ type: 'traitMoment', moment: 'fearFaced', traitId: 'warVeteran' }], { source: 'ai' }).state;
    expect(s.traits.held.find((h) => h.id === 'warVeteran')!.overcome).toBe(true);
    expect(traitRollMod(s.traits.held, ['bombardment']).total).toBe(0);
    expect(traitRollMod(s.traits.held, ['battleFear']).total).toBe(2);
    s = applyEvents(REGISTRY, s, [{ type: 'traitMoment', moment: 'massacre' }], { source: 'ai' }).state;
    expect(s.traits.held.map((h) => h.id)).toContain('massacreSurvivor');
    // A temperament shifts after three recorded moments, not before.
    for (let i = 0; i < 2; i++) s = applyEvents(REGISTRY, s, [{ type: 'traitMoment', moment: 'temperamentTested', traitId: 'hotHeaded', toward: 'patient' }], { source: 'ai' }).state;
    expect(s.traits.held.map((h) => h.id)).toContain('hotHeaded');
    s = applyEvents(REGISTRY, s, [{ type: 'traitMoment', moment: 'temperamentTested', traitId: 'hotHeaded', toward: 'patient' }], { source: 'ai' }).state;
    expect(s.traits.held.map((h) => h.id)).toEqual(expect.arrayContaining(['patient']));
    expect(s.traits.held.map((h) => h.id)).not.toContain('hotHeaded');
  });
  it('no other source changes traits: the AI cannot send the quiz event', async () => {
    const s = await prepare({ name: 'Change Two' });
    const r = applyEvents(REGISTRY, s, [{ type: 'formativeQuizTaken', answers: [] }], { source: 'ai' });
    expect(r.rejected.length).toBe(1);
  });
  it('a tie ends when its person dies', async () => {
    const s = await prepare({ name: 'Tie One', traits: { origin: 'templeRaised', temperament: 'patient', scarOrTie: 'rival' } });
    const name = s.traits.held.find((h) => h.id === 'rival')!.tieName!;
    const npc = selectNpcs(s).find((n) => n.name === name)!;
    expect(npc).toBeDefined();
    const r = applyEvents(REGISTRY, s, [{ type: 'npcDied', npcRef: npc.id, cause: 'test' }], { source: 'engine' });
    expect(r.state.traits.held.map((h) => h.id)).not.toContain('rival');
    expect(r.state.traits.history.at(-1)).toMatchObject({ change: 'removed', id: 'rival' });
  });
});

describe('NPCs, the narrator, old saves', () => {
  it('generated NPCs get one or two traits from the seed; canon ones from the lore list', () => {
    const t = generatedNpcTraits('camp:npc-1');
    expect(t.length).toBeGreaterThanOrEqual(1);
    expect(t.length).toBeLessThanOrEqual(2);
    expect(generatedNpcTraits('camp:npc-1')).toEqual(t);
    for (const c of CANON_TRAITS) {
      expect(CANON_BY_ID.has(c.canonId), c.canonId).toBe(true);
      for (const id of c.traits) expect(TRAIT_BY_ID.has(id), `${c.canonId}: ${id}`).toBe(true);
      expect(c.source.length).toBeGreaterThan(10);
    }
  });
  it('the narrator context carries the traits and their notes', () => {
    const s = campaignState({ traits: { origin: 'templeRaised', temperament: 'curious', scarOrTie: 'rival' } });
    const lines = selectTraitLines(s, []);
    expect(lines[0]).toMatch(/Temple-raised: Sheltered/);
    expect(lines[0]).toMatch(/Curious: Asks one question too many/);
    expect(traitsFeature.promptSection!(s)).toMatch(/CHARACTER TRAITS/);
    expect(stateBlock(s, makeEstimator(4)).text).toMatch(/CHARACTER TRAITS.*Temple-raised/);
    // The tie's person is introduced; when present, the narrator gets their traits too.
    const tie = selectNpcs(s)[0]!;
    const withTie = { ...s, pacing: { ...s.pacing, scene: { ...s.pacing.scene, presentNpcIds: [tie.id] } } };
    expect(selectTraitLines(withTie, [tie.id]).some((l) => l.startsWith(tie.name))).toBe(true);
  });
  it('a check in a trait situation takes the modifier', () => {
    const s = campaignState({ traits: { origin: 'templeRaised', temperament: 'curious', scarOrTie: 'rival' } });
    expect(selectCheckTraitMod(s, { skillId: 'willpower', situation: 'despair', npcTargets: [] }).total).toBe(0);
    const stub = { ...s, traits: { ...s.traits, held: holds('idealistic') } };
    expect(selectCheckTraitMod(stub, { skillId: 'willpower', situation: 'despair', npcTargets: [] }).total).toBe(2);
  });
  it('an old save loads with no traits and no quiz, and neither is offered later', () => {
    const s = campaignState({ traits: { origin: 'templeRaised', temperament: 'curious', scarOrTie: 'rival' } });
    const env = makeEnvelope(REGISTRY, s, 'x') as { featureVersions: Record<string, number>; state: Record<string, unknown> };
    const { traits: _t, ...state } = env.state;
    const { traits: _v, ...versions } = env.featureVersions;
    const loaded = loadEnvelope(REGISTRY, { ...env, featureVersions: versions, state });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.traits.held).toEqual([]);
    expect(loaded.state.traits.quiz.status).toBe('never');
    const later = advanceTime(REGISTRY, loaded.state, { seconds: 3 * 368 * 86400, reason: 'skip', source: 'turnDraft', jump: true }).state;
    expect(later.traits.quiz.status).toBe('never');
    expect(selectQuizPlan(later)).toBeNull();
  });
  it('a Jedi quiz standing step adds to Order standing', () => {
    const s = campaignState({ traits: { origin: 'templeRaised', temperament: 'curious', scarOrTie: 'rival' } });
    const up = { ...s, traits: { ...s.traits, standing: { order: 2 } } };
    expect(selectStanding(up)).toBeGreaterThanOrEqual(selectStanding(s));
  });
});

describe('Part A: the m8-skills review fixes', () => {
  const pace = (id: string, k: string): number => ARCHETYPE_BY_ID.get(id)!.paces.knight![k] ?? 0;
  it('field agent Intelligence about officer level (below the analyst) with a Tactics share; officer Blaster about 0.35', () => {
    expect(pace('intelAgent', 'intelligence')).toBeGreaterThanOrEqual(pace('officer', 'intelligence'));
    expect(pace('intelAgent', 'intelligence')).toBeLessThan(pace('intelAnalyst', 'intelligence'));
    expect(pace('intelAgent', 'tactics')).toBeGreaterThan(0.25);
    expect(pace('officer', 'blaster')).toBeGreaterThan(0.3);
    expect(pace('officer', 'blaster')).toBeLessThan(0.4);
    // The naval officer in proportion (0.106 x 0.344 / 0.202 = 0.18).
    expect(pace('navalOfficer', 'blaster') / pace('officer', 'blaster')).toBeCloseTo(0.106 / 0.202, 1);
  });
  it("Darth Desolous's defence edge only while carrying a cortosis shield", () => {
    const x = { exchange: 1, roll: 'strikeAgainst' as const, surprise: false, armoured: false, unarmed: false, oppArmed: true, oppRanged: false, oppSaber: true, opponents: 1, footing: 0 };
    expect(styleEdge('vsSaber', 1, x)).toBe(0);
    expect(styleEdge('vsSaber', 1, { ...x, cortosisShield: true })).toBe(1);
  });
  it('Tavus and Rusk are soldiers again; the generals stay officers', () => {
    expect(CANON_BY_ID.get('lore:harron-tavus')!.archetype).toBe('soldier');
    expect(CANON_BY_ID.get('lore:fideltin-rusk')!.archetype).toBe('soldier');
    expect(CANON_BY_ID.get('lore:jace-malcom')!.archetype).toBe('officer');
  });
  it('the approved drafts: Quinn Tactics 70, Thrawn Investigation 105, R2-D2 Repair 90; anchors for roster figures', () => {
    const d = (n: string) => SKILL_DRAFTS.find((x) => x.name.startsWith(n))!;
    expect(d('Malavai Quinn').draft['tactics']).toBe(70);
    expect(d('Grand Admiral Thrawn').draft['investigation']).toBe(105);
    expect(d('R2-D2').draft['repair']).toBe(90);
    expect(d('Grand Moff Tarkin').draft['blaster']).toBe(30);
    expect(d('Galena Rans').draft).toEqual({ piloting: 60, gunnery: 50, tactics: 45, blaster: 35 });
    const quinn = CANON_BY_ID.get('lore:malavai-quinn')!;
    expect(canonFigureLevelsAt(quinn, 3640, day(3640))['tactics']).toBeCloseTo(70, 1);
    const galena = CANON_BY_ID.get('lore:galena-rans')!;
    expect(canonFigureLevelsAt(galena, 3655, day(3655))['piloting']).toBeCloseTo(60, 1);
    const nine = CANON_BY_ID.get('lore:cipher-nine')!;
    expect(canonFigureLevelsAt(nine, 3640, day(3640))['melee']).toBeCloseTo(70, 1);
    // A draft for a figure not on the roster is stored, not applied.
    expect(CANON_BY_ID.has('lore:thrawn')).toBe(false);
  });
});
