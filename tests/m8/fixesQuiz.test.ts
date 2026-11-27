// m8-fixes Part G (Jared's quiz play test, 26 Nov 2026): G1 scenes from every stage lived, weighted toward the latest; G3 the
// Character tab's traits; G4 a tie from outside is someone outside the Order, with the player's note read and kept; G5 quiz people
// at the age they are now; G6 the Train list offers only what the path and teachers make available.
import { describe, expect, it } from 'vitest';
import { FORMATIVE_EVENT_BY_ID } from '../../src/data/formativeEvents';
import { selectTrainOptions } from '../../src/features/progression/selectors';
import { quizPlan, selectTraitRows, type QuizInput } from '../../src/features/traits/selectors';
import { quizPersonKind, readPersonNote, stageAllocation } from '../../src/features/traits/rules';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, creationQuizInput, type NewCampaignInput } from '../../src/turn/campaign';
import { base, masterHere, meet } from '../support/schemaSituations';

const setOf = (id: string): string => FORMATIVE_EVENT_BY_ID.get(id)!.set;
const jedi = (fromAge: number, toAge: number, seed: string): QuizInput => ({ track: 'jedi', fromAge, toAge, birthYear: -3661 - toAge, origin: 'templeRaised', forceSensitive: true, atCoruscant3653: false, seed });

describe('G1: scenes from every stage lived, weighted toward the latest', () => {
  it('the allocation: one a stage at least, the rest toward the latest', () => {
    expect(stageAllocation(3, 6)).toEqual([1, 2, 3]);
    expect(stageAllocation(1, 4)).toEqual([4]);
    expect(stageAllocation(4, 8).at(-1)).toBeGreaterThan(stageAllocation(4, 8)[0]!);
  });
  it('a 14-year-old Padawan draws Padawan scenes; a 20-year-old more Padawan than Initiate; a youngling Initiate only', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const p14 = quizPlan(jedi(0, 14, seed)).events.map(setOf);
      expect(p14.filter((x) => x === 'padawan').length, seed).toBeGreaterThan(0);
      expect(p14.filter((x) => x === 'initiate').length).toBeGreaterThan(0);
      const p20 = quizPlan(jedi(0, 20, seed)).events.map(setOf);
      expect(p20.filter((x) => x === 'padawan').length).toBeGreaterThan(p20.filter((x) => x === 'initiate').length);
      expect(quizPlan(jedi(6, 7, seed)).events.map(setOf).every((x) => x === 'initiate')).toBe(true);
    }
    const civ = quizPlan({ track: 'civilian', fromAge: 0, toAge: 25, birthYear: -3686, origin: 'underlevels', forceSensitive: false, atCoruscant3653: false, seed: 'x' }).events.map(setOf);
    expect(civ.every((x) => x === 'street' || x === 'anyone')).toBe(true);
  });
});

describe('G4, G5: the quiz people fit the scene, the tie and the note', () => {
  it('the note is read for what code can read: a relation and a homeworld stated plainly', () => {
    const world = (w: string): string | null => (w === 'Alderaan' ? 'Alderaan' : null);
    expect(readPersonNote('My older sister still writes from Alderaan', world)).toEqual({ relation: 'older sister', ageOffset: 4, homeworld: 'Alderaan' });
    expect(readPersonNote('a friend from the lower levels', world)).toEqual({ relation: 'friend', ageOffset: 0 });
    expect(readPersonNote('we were close once', world)).toEqual({});
    expect(quizPersonKind({ who: 'someone outside the Order you keep in touch with', tie: 'familyTie' })).toBe('outside');
    expect(quizPersonKind({ who: 'a clanmate, partner in a prank' })).toBe('peer');
    expect(quizPersonKind({ who: 'a street kid you look after', tie: 'ward' })).toBe('younger');
  });
  it('a 14-year-old Padawan\'s tie from outside: a civilian outside the Order, the note kept; a clanmate the same age now', async () => {
    let input: NewCampaignInput | null = null;
    for (let i = 0; i < 200 && !input; i++) {
      const candidate: NewCampaignInput = {
        name: `Quiz Padawan ${i}`,
        birthDate: { year: -3675, month: 1, day: 1 },
        startDate: { year: -3661, month: 1, day: 1 },
        startSecond: 7 * 3600,
        creation: { speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: 'padawan', trainingStartAge: 4, talents: {}, dominantHand: 'right' },
        traits: { origin: 'templeRaised', temperament: 'patient', scarOrTie: 'rival' },
      };
      const ev = quizPlan(creationQuizInput(candidate)!).events;
      if (ev.includes('init.outsideTie') && ev.some((id) => FORMATIVE_EVENT_BY_ID.get(id)!.choices[0]!.person && setOf(id) === 'initiate' && id !== 'init.outsideTie')) input = candidate;
    }
    expect(input).not.toBeNull();
    const plan = quizPlan(creationQuizInput(input!)!);
    const answers = plan.events.map((id) => (id === 'init.outsideTie' ? { eventId: id, choiceId: 'secret', note: 'My older sister still writes from Alderaan' } : { eventId: id, choiceId: FORMATIVE_EVENT_BY_ID.get(id)!.choices[0]!.id }));
    const s: GameState = (await createCampaign(REGISTRY, createMemoryStorage(), { ...input!, formative: { answers } }, { campaignId: 'g4', branchId: 'b' }, 'x')).state;
    const npcs = Object.values(s.npcs.byId);
    const sister = npcs.find((n) => n.relation === 'older sister')!;
    expect(sister).toBeDefined();
    expect(sister.factionId).toBe('civilian');
    expect(sister.role).toBe('civilian');
    expect(sister.homeworld).toBe('Alderaan');
    expect(sister.playerNote).toBe('My older sister still writes from Alderaan');
    const ageOf = (birth: number | null): number => Math.round((s.clock.now.day - (birth ?? 0)) / 368);
    expect(ageOf(sister.birthDay)).toBe(18);
    // A clanmate from the Initiate years is about the character's age now (14), not their age then.
    const clanmate = npcs.find((n) => /clanmate/i.test(n.description))!;
    expect(clanmate).toBeDefined();
    expect(ageOf(clanmate.birthDay)).toBe(14);
    expect(clanmate.role).toBe('padawan');
  });
});

describe('G3: the Character tab lists the traits', () => {
  it('each with its upside, downside, and the person it is tied to', () => {
    const s = base();
    const withTraits = { ...s, traits: { ...s.traits, held: [{ id: 'hotHeaded', since: 0, source: 'creation' }, { id: 'familyTie', since: 0, source: 'creation', tieName: 'Mira Vos' }] } } as unknown as GameState;
    const rows = selectTraitRows(withTraits);
    expect(rows.map((r) => r.id)).toEqual(['hotHeaded', 'familyTie']);
    expect(rows[0]!.good.length && rows[0]!.bad.length).toBeTruthy();
    expect(rows[1]!.tie).toEqual({ name: 'Mira Vos', npcId: null });
  });
});

describe('G6: the Train list offers what the path and teachers make available', () => {
  it('a Jedi Padawan is not offered the Sith Academy\'s warblade class or dark powers; a Sith acolyte is offered the warblade', () => {
    const pad = masterHere(base());
    const ids = selectTrainOptions(pad).map((o) => o.id);
    expect(ids).not.toContain('warbladeTraining');
    expect(ids).not.toContain('lightningControl');
    expect(ids).not.toContain('chokeControl');
    const sith = base({ path: 'sith', rank: 'acolyte' });
    expect(selectTrainOptions(sith).map((o) => o.id)).toContain('warbladeTraining');
  });
  it('what would be refused now is greyed with the reason; what is open is open', () => {
    const opts = selectTrainOptions(meet(base(), []));
    expect(opts.some((o) => o.open)).toBe(true);
    for (const o of opts.filter((x) => !x.open)) expect(o.why, o.id).toBeTruthy();
  });
});
