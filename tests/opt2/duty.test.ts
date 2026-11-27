// opt-2 D (Jared, 26 Nov 2026): duty status, the daily mission roll, the injury check, mission ends, skips that stop only on what
// touches the character, home days and "Resume the skip", the narrator's state line.
import { describe, expect, it } from 'vitest';
import { intentSchema } from '../../src/ai/schemas/intent';
import { MISSION_ROLL } from '../../src/data/duty.config';
import { WORLD_NETWORK } from '../../src/data/worldNetwork';
import { dutyFeature } from '../../src/features/duty';
import { selectAtHome, touchesCharacter } from '../../src/features/duty/home';
import { injuryBlock, missionChance, missionMedian } from '../../src/features/duty/rules';
import { selectDutyLine, selectFitnessLine, selectHomeDayLine } from '../../src/features/duty/selectors';
import { resumeSkipChoice } from '../../src/turn/skipAhead';
import { seedRng } from '../../src/engine/rng';
import type { Wound } from '../../src/engine/wounds';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { resolveTurn } from '../../src/turn/resolve';
import { at, base } from '../support/schemaSituations';

const skip = (days: number) => intentSchema.parse({ actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: days >= 7 ? 'timeSkip' : 'montage', requestedSpan: { amount: days, unit: 'days' } });
const ev = (s: GameState, events: object[], source: 'ai' | 'engine' = 'ai') => applyEvents(REGISTRY, s, events, { source });
const wound = (severity: Wound['severity'], healProgress = 0): Wound => ({ id: `w-${severity}`, part: 'leftArm', severity, W: 5, stabilized: false, healProgress, day: 0, source: 'test' }) as Wound;
const hurt = (s: GameState, w: Wound): GameState => ({ ...s, health: { ...s.health, wounds: [...s.health.wounds, w] as GameState['health']['wounds'] } });

/** At the posting's forward base (m9-missions B5: a 3,661 BBY Knight is posted first, and the roll runs at base). */
function atBase(s: GameState): GameState {
  const p = s.duty.posting;
  if (!p || selectAtHome(s)) return s;
  return ev(s, [{ type: 'locationIntroduced', name: p.base.planet, kind: 'planet', region: 'Colonies', description: '', moveHere: true }], 'engine').state;
}
/** Skips in pieces until the duty roll assigns a mission (or forty skips pass). */
function untilAssigned(s0: GameState): { s: GameState; reason: string | undefined } {
  let s = s0;
  for (let i = 0; i < 40; i++) {
    const r = resolveTurn(REGISTRY, atBase(s), skip(365));
    s = r.state;
    if (s.duty.status === 'mission') return { s, reason: r.draft.timeAdvanced?.interrupted };
  }
  return { s, reason: undefined };
}
/** The code ends the mission (as /mission end does): back at base, or ended by the engine. */
const ended = (s: GameState): GameState => ev(s, [{ type: 'missionEnded', how: 'done', outcome: 'success' }], 'engine').state;
/** Time passing after a reply: the code checks the mission's end on the next passage of time (the reply's own time runs first). */
const later = (s: GameState): GameState => ev(s, [{ type: 'timeElapsed', seconds: 1800, reason: 'time passes' }]).state;
const missionThreadId = (s: GameState): string => Object.values(s.threads.byId).find((t) => t.title === s.duty.mission!.threadTitle && t.status === 'open')!.id;
void later;

describe('D2: the daily mission roll', () => {
  it('is zero in the first days home, rises smoothly, and half are assigned by the median', () => {
    const med = MISSION_ROLL.medianPeace;
    for (let d = 0; d <= MISSION_ROLL.quietDays; d++) expect(missionChance(d, med)).toBe(0);
    let survive = 1;
    let last = 0;
    for (let d = 1; d <= 200; d++) {
      const p = missionChance(d, med);
      if (d > MISSION_ROLL.quietDays + 1) expect(p).toBeGreaterThan(last);
      last = p;
      survive *= 1 - p;
      if (d === med) expect(survive).toBeCloseTo(0.5, 6);
      if (d === 60) expect(survive).toBeLessThan(0.1);
    }
  });

  it('war shortens the wait; a Padawan waits longer than a Knight; an Initiate gets none', () => {
    const knight = base();
    expect(missionMedian(knight)).toBe(MISSION_ROLL.medianWar); // 3,661 BBY: the Great War
    expect(missionMedian(base({ rank: 'padawan' }))!).toBeGreaterThan(missionMedian(knight)!);
    expect(missionMedian(base({ rank: 'initiate' }))).toBeNull();
  });
});

describe('D1: duty status, owned by the code', () => {
  it("a skip runs to the day the roll comes up; the mission and its thread are the code's", () => {
    const { s, reason } = untilAssigned(base());
    expect(s.duty.status).toBe('mission');
    expect(reason).toMatch(/^A mission assignment: /);
    expect(missionThreadId(s)).toBeTruthy();
    expect(selectDutyLine(s)).toMatch(/^On a mission: /);
  });

  it('the narrator can neither assign nor end a mission', () => {
    const s = base();
    const { s: on } = untilAssigned(base());
    expect(ev(s, [{ type: 'missionAssigned', mission: on.duty.mission }]).rejected).toHaveLength(1);
    expect(ev(on, [{ type: 'missionEnded', how: 'done' }]).rejected).toHaveLength(1);
  });

  it("the narrator resolving the mission's thread no longer ends it (m9-missions B1); the code's end makes the next day a home day", () => {
    const { s } = untilAssigned(base());
    const told = later(ev(s, [{ type: 'threadResolved', threadRef: missionThreadId(s), outcome: 'resolved', note: 'done' }]).state);
    expect(told.duty.status).toBe('mission');
    const done = ended(s);
    expect(done.duty.status).toBe('home');
    expect(done.duty.homeDay).toBe(done.clock.now.day + 1);
  });

  it('a mission ends when the character comes back to base after reaching the target (with the work undone: a failure)', () => {
    const { s } = untilAssigned(base());
    const m = s.duty.mission!;
    const there = ev(ev(s, [{ type: 'locationIntroduced', name: m.targetWorld, kind: 'planet', region: 'Mid Rim', description: '', moveHere: true }], 'engine').state, [{ type: 'missionArrived', where: 'target' }], 'engine').state;
    const away = later(there);
    expect(selectAtHome(away)).toBe(false);
    expect(away.duty.status).toBe('mission');
    const home = Object.values(away.locations.byId).find((l) => l.name === (m.base.planet ?? 'Coruscant'))!.id;
    const back = later(ev(away, [{ type: 'locationChanged', locationRef: home }]).state);
    expect(back.duty.status).toBe('home');
    expect(back.duty.history.at(-1)?.outcome).toBe('failure');
  });
});

describe('D3: injured and recovering', () => {
  it('an unhealed wound blocks an assignment; in an all-hands situation a minor wound does not, anything worse does', () => {
    expect(injuryBlock([wound('minor')], false)).not.toBeNull();
    expect(injuryBlock([wound('minor')], true)).toBeNull();
    expect(injuryBlock([wound('moderate')], true)).not.toBeNull();
    expect(injuryBlock([wound('moderate', 0.8)], false)).toBeNull(); // healed enough (three quarters)
  });

  it('while recovering the roll is held back and logged; the side panel says so', () => {
    const s0 = hurt(base(), wound('critical', 0));
    expect(selectFitnessLine(s0)).toMatch(/^Recovering: critical wound to the left arm/);
    // Thirty days (a critical wound is three-quarters healed at about 34 days of rest): held back, never assigned.
    let s = s0;
    for (let i = 0; i < 6 && s.clock.now.day - s0.clock.now.day < 28; i++) s = resolveTurn(REGISTRY, s, skip(28 - (s.clock.now.day - s0.clock.now.day))).state;
    expect(s.duty.status).toBe('home');
    expect(s.duty.log.some((l) => l.what.startsWith('held back: a critical wound'))).toBe(true);
  });
});

describe('D4: what stops a skip', () => {
  it("a distant timeline event goes into the report; one at the character's place or a turn for their side stops it", () => {
    const s = base();
    const hydian = WORLD_NETWORK.events.find((e) => e.id === 'E.3660.hydian_battle')!;
    expect(touchesCharacter(s, hydian)).toBeNull();
    expect(touchesCharacter(at(s, 'Hydian Way', 'other'), hydian)).not.toBeNull();
    const treaty = WORLD_NETWORK.events.find((e) => e.id === 'E.3653.treaty')!;
    expect(touchesCharacter(s, treaty)).not.toBeNull();
  });
});

describe('D5: home days', () => {
  it('the day after a mission stops a skip, with "Resume the skip" first; the player may stay as long as they like', () => {
    const { s } = untilAssigned(base());
    const done = ended(atBase(s));
    const r = resolveTurn(REGISTRY, done, skip(60));
    expect(r.draft.timeAdvanced?.interrupted).toBe('A home day after the mission');
    expect(r.state.clock.now.day).toBe(done.duty.homeDay);
    const choice = resumeSkipChoice(r.state)!;
    expect(choice.label).toMatch(/^Resume the skip \(\d+ days left\)$/);
    expect(selectHomeDayLine(r.state)).toMatch(/^HOME DAY/);
    const resumed = resolveTurn(REGISTRY, r.state, skip(choice.spanDays));
    expect(resumed.draft.timeAdvanced?.interrupted).not.toBe('A home day after the mission');
  });

  it("the Settings switch stops a skip on the routine's free day at home; off, it does not", () => {
    // A rolled world event can stop a short skip first: across seeds, on stops some skip on a free day, off never does.
    let stopped = 0;
    for (let i = 0; i < 6; i++) {
      const s0 = base({ rank: 'initiate' });
      const s = { ...s0, meta: { ...s0.meta, rngState: seedRng(`free-${i}`) } };
      expect(resolveTurn(REGISTRY, s, skip(30)).draft.timeAdvanced?.interrupted).not.toBe('A free day at home');
      const on = resolveTurn(REGISTRY, s, skip(30), { homeDays: true });
      if (on.draft.timeAdvanced?.interrupted === 'A free day at home') {
        stopped++;
        expect(resumeSkipChoice(on.state)).not.toBeNull();
      }
    }
    expect(stopped).toBeGreaterThan(0);
  });

  it('no home day on a mission', () => {
    const { s } = untilAssigned(base());
    // Five days (a mission never set out for goes to someone else after seven, m9-missions B4).
    const r = resolveTurn(REGISTRY, s, skip(5), { homeDays: true });
    expect(r.state.duty.status).toBe('mission');
    expect(r.draft.timeAdvanced?.interrupted ?? '').not.toMatch(/home day|free day/i);
  });
});

describe("D6: the narrator's state line", () => {
  it('states duty and fitness, and that the code owns them', () => {
    const line = dutyFeature.promptSection!(base())!;
    expect(line).toMatch(/^DUTY \(the code's; narrate it, never change it/);
    expect(line).toMatch(/Fit for duty/);
  });
});
