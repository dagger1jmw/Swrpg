// m9-release Part A (Jared, 27 Nov 2026): the m9-missions review fixes. A mission fight stage resolved to its end through the turn
// pipeline (A1), narrator choices and fights during a stage (A2), trips never clamped (A3), summons wording (A4), the order arriving
// (A5), "posted, not yet left" (A6), days off on a front (A7), leave from the war's first posting (A8), wounds while posted (A9),
// the Council's best on a field path (A10), all travel the code's (A12), leads found in play (A13).
import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../../src/state/registry';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider } from '../../src/ai/fixtureProvider';
import { intentSchema } from '../../src/ai/schemas/intent';
import type { Choice } from '../../src/ai/schemas/compose';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { MISSION_ROLL_FRONT } from '../../src/data/duty.config';
import { MISSION_TYPES } from '../../src/data/missions.config';
import { seedRng } from '../../src/engine/rng';
import type { Wound } from '../../src/engine/wounds';
import { councilBestReason, fieldPath, npcIsCouncilBest, postingFor } from '../../src/features/duty/missions';
import { missionChance, missionRoll } from '../../src/features/duty/rules';
import { selectCurrentWorld, selectDutyLine, selectMissionPromptLine } from '../../src/features/duty/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { describeJump } from '../../src/turn/context';
import { runDevCommand } from '../../src/turn/devCommands';
import { missionAfterTurn, missionChoices } from '../../src/turn/missionTurn';
import { checkNarration, hintsAtMission } from '../../src/turn/narrationCheck';
import { narratorMoveWorld, playTurn, stageFightBarred, untaggedStageChoice, type Session, type TurnDeps } from '../../src/turn/pipeline';
import { pacingForSpan, resolveTurn, type TurnDraft } from '../../src/turn/resolve';
import { base, meet } from '../support/schemaSituations';

const ev = (s: GameState, events: object[], source: 'ai' | 'engine' | 'dev' = 'engine') => applyEvents(REGISTRY, s, events, { source });
const testChar = (s: GameState): GameState => ({ ...s, character: { ...s.character, testCharacter: true } });
const intent = (o: object) => intentSchema.parse({ actionType: 'other', targets: [], references: [], unknownNames: [], ...o });
const skip = (days: number) => intent({ actionType: 'train', requestedPacing: days >= 7 ? 'timeSkip' : 'montage', requestedSpan: { amount: days, unit: 'days' } });
const travel = (world: string) => intent({ actionType: 'travel', unknownNames: [world] });
const withLevel = (s: GameState, id: string, xp: number): GameState => ({ ...s, progression: { ...s.progression, skills: { ...s.progression.skills, [id]: { ...(s.progression.skills[id] ?? {}), xp } } } }) as GameState;
const wound = (severity: Wound['severity']): Wound => ({ id: `w-${severity}`, part: 'leftArm', severity, W: 20, stabilized: true, healProgress: 0, day: 0, source: 'test' }) as Wound;
const hurt = (s: GameState, w: Wound): GameState => ({ ...s, health: { ...s.health, wounds: [...s.health.wounds, w] as GameState['health']['wounds'] } });
/** A 500 BBY (peace) Jedi Knight at the Temple. */
function peaceKnight(rank = 'knight'): GameState {
  const s0 = base({ rank });
  const day = s0.clock.now.day + Math.round((3661 - 500) * 368);
  const s = { ...s0, clock: { ...s0.clock, now: { ...s0.clock.now, day } }, duty: { ...s0.duty, since: day } };
  return runDevCommand(REGISTRY, testChar(s), '/home').state;
}
const start = (s: GameState, cmd: string): GameState => {
  const r = runDevCommand(REGISTRY, testChar(s), cmd);
  expect(r.ok, r.line).toBe(true);
  return r.state;
};
const narration = (text: string, events: object[] = [], choices: object[] = [{ label: 'Look around', intent: { actionType: 'other' } }, { label: 'Wait', intent: { actionType: 'rest' } }]) => ({ narrative: text, choices, scene: { moodTags: [] }, events });

function deps(replies: { callType?: string; data: unknown }[]): TurnDeps & { provider: ReturnType<typeof createFixtureProvider> } {
  const provider = createFixtureProvider(replies.map((r) => ({ ...(r.callType ? { callType: r.callType as 'narrative' } : {}), data: r.data })));
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
  let ms = Date.UTC(2026, 10, 27);
  return { registry: REGISTRY, provider, router, storage: createMemoryStorage(), getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) };
}
const session = (state: GameState): Session => ({ state, history: [], campaign: { campaignId: 'c', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } });

describe('A1: a mission fight stage resolved to its end through the turn pipeline', () => {
  it('Go in, then Resolve to end: the fight ends, the stage is decided, every call has its time', { timeout: 120_000 }, async () => {
    for (const seed of ['r1', 'r2', 'r3', 'r4']) {
      const d = deps(Array.from({ length: 20 }, () => ({ data: narration('The fight is told.') })));
      let s = start(withLevel(peaceKnight(), 'soresu', 65 * 65 * 100), '/mission start strike Ord Mantell');
      s = { ...s, meta: { ...s.meta, rngState: seedRng(seed) } };
      s = resolveTurn(REGISTRY, s, travel('Ord Mantell')).state;
      s = ev(s, [{ type: 'missionStageResolved', success: true, why: 'in' }]).state;
      expect(s.duty.mission!.stages[s.duty.mission!.current]!.kind).toBe('fight');
      let sess = session(s);
      const go = missionChoices(sess.state)[0]!;
      expect(go.label).toMatch(/^Go in/);
      sess = (await playTurn(d, sess, { kind: 'choice', choice: go })).session;
      expect(sess.state.combat.active, seed).not.toBeNull();
      const t0 = Date.now();
      const r = await playTurn(d, sess, { kind: 'beat', action: { action: 'resolve' }, label: 'Resolve to end' });
      expect(Date.now() - t0, 'the turn settles at once').toBeLessThan(10_000);
      sess = r.session;
      expect(sess.state.combat.active, seed).toBeNull();
      // The stage's fight is decided by the code after the turn: no stage is left waiting on a fight that ended.
      const m = sess.state.duty.mission;
      if (m) expect(m.stages.every((st) => st.fightId === null), seed).toBe(true);
      expect(r.record.draft.applied.some((a) => a.event.type === 'missionStageResolved'), seed).toBe(true);
      for (const c of r.record.calls) expect(typeof c.ms).toBe('number');
    }
  });
});

describe('A2: the narrator never resolves a stage', () => {
  const atGetIn = (): GameState => {
    let s = start(peaceKnight(), '/mission start rescue Manaan');
    s = resolveTurn(REGISTRY, s, travel('Manaan')).state;
    s = ev(s, [{ type: 'missionStageResolved', success: true, why: 'located' }]).state;
    expect(s.duty.mission!.stages[s.duty.mission!.current]!.label).toBe('get in');
    return s;
  };

  it('the MISSION line lists each approach with its skill id, and forbids narrating the outcome or starting a fight', () => {
    const line = selectMissionPromptLine(atGetIn())!;
    expect(line).toMatch(/slip in unseen \(skillId stealth\)/);
    expect(line).toMatch(/Never narrate this stage's success, failure or a discovery/);
    expect(line).toMatch(/Never start a fight at this stage/);
  });

  it('an untagged choice takes the intent call; a tagged one (skillId of an approach) and the code\'s own do not', () => {
    const s = atGetIn();
    const infiltrate: Choice = { label: 'Infiltrate the maintenance bay to rescue the captives', intent: { actionType: 'other' } };
    expect(untaggedStageChoice(s, infiltrate)).toBe(true);
    expect(untaggedStageChoice(s, { ...infiltrate, intent: { actionType: 'other', skillId: 'stealth' } })).toBe(false);
    expect(untaggedStageChoice(s, missionChoices(s)[0]!)).toBe(false);
    expect(untaggedStageChoice(s, { label: 'Fly home', intent: { actionType: 'travel' } })).toBe(false);
    expect(untaggedStageChoice(peaceKnight(), infiltrate)).toBe(false);
  });

  it('through the pipeline: the infiltration choice is read as Stealth and rolls "slip in unseen"', { timeout: 60_000 }, async () => {
    const d = deps([
      { callType: 'intent', data: { actionType: 'other', skillId: 'stealth', targets: [], references: [], unknownNames: [] } },
      { callType: 'narrative', data: narration('You move along the service ducts.') },
    ]);
    const r = await playTurn(d, session(atGetIn()), { kind: 'choice', choice: { label: 'Infiltrate the maintenance bay to rescue the captives', intent: { actionType: 'other' } } });
    expect(d.provider.calls.map((c) => c.opts.callType)).toEqual(['intent', 'narrative']);
    expect(r.record.draft.checks[0]?.label).toMatch(/get in: slip in unseen/);
  });

  it("a narrator's fight during the stage is refused unless a failed check brought it this turn", () => {
    const s = atGetIn();
    const quiet = { applied: [] } as unknown as TurnDraft;
    expect(stageFightBarred(s, quiet)).toBe(true);
    const failed = { applied: [{ event: { type: 'missionStageResolved', success: false } }] } as unknown as TurnDraft;
    expect(stageFightBarred(s, failed)).toBe(false);
    expect(stageFightBarred(peaceKnight(), quiet)).toBe(false);
  });

  it('narrating a discovery or a clean entry on an unrolled stage is caught; an ordinary line is not', () => {
    const draft = { combat: null, applied: [], checks: [], jump: null, intent: null } as unknown as TurnDraft;
    const known = { player: [], stageWaiting: 'get in' };
    for (const t of ['A guard spots you at the hatch.', 'You are spotted by the patrol.', 'Someone trips the alarm.', 'You slip inside unseen.']) {
      expect(checkNarration(t, draft, false, known).map((i) => i.kind), t).toContain('stageNarrated');
    }
    expect(checkNarration('The bay hums with machinery and the smell of kolto.', draft, false, known)).toEqual([]);
    expect(checkNarration('A guard spots you at the hatch.', draft, false, { player: [] })).toEqual([]);
  });
});

describe("A3: the code's trips are never clamped", () => {
  it('a trip of 12-24 h keeps its length (a montage to the morning nearest the arrival), never 12 h', () => {
    expect(pacingForSpan(22 * 3600, undefined, true)).toEqual({ level: 'montage', seconds: 79_200 });
    expect(pacingForSpan(22 * 3600).clampedFrom).toBe(79_200);
    let s = ev(peaceKnight(), [{ type: 'locationIntroduced', name: 'Devaron', kind: 'planet', region: 'Colonies', description: '', moveHere: true }]).state;
    const r = resolveTurn(REGISTRY, s, travel('Manaan'));
    expect(r.draft.travel?.ok).toBe(true);
    const hours = r.draft.travel!.hours!;
    expect(r.draft.report.some((x) => /clamped/.test(x))).toBe(false);
    expect(r.draft.timeAdvanced!.seconds / 3600).toBeGreaterThan(Math.min(hours, 24) - 12);
    s = r.state;
    expect(selectCurrentWorld(s)).toBe('Manaan');
  });
});

describe('A4: summons and Council calls are caught, the opening too; ordinary lines are not', () => {
  it('the phrases', () => {
    for (const t of ['A messenger droid arrives with a summons from the High Council.', 'Acknowledge the summons and make your way to the Council Chamber', 'The Council has summoned you.', 'Your presence is requested in the Council Chamber.', 'Report to the Council at once.', 'The Masters wish to see you.', 'New orders have come through.']) {
      expect(hintsAtMission(t), t).toBe(true);
    }
    for (const t of ['The Council Chamber is quiet at this hour.', 'Master Zym sits on the Council.', 'You summon your strength and stand.', 'You head to the Archives.', 'She turns to the next task.', 'Your master wishes to see you after the lesson.']) {
      expect(hintsAtMission(t), t).toBe(false);
    }
  });

  it("the opening's summons is retried and its choice dropped", { timeout: 60_000 }, async () => {
    const summons = narration('A messenger droid finds you in the gardens with a summons from the High Council.', [], [
      { label: 'Acknowledge the summons and make your way to the Council Chamber', intent: { actionType: 'travel' } },
      { label: 'Keep meditating', intent: { actionType: 'rest' } },
    ]);
    const d = deps([{ data: summons }, { data: summons }]);
    const r = await playTurn(d, session(peaceKnight()), { kind: 'opening', premise: '' });
    expect(r.record.draft.report.some((x) => /missionOffered/.test(x))).toBe(true);
    expect(r.record.narrative).not.toMatch(/summons/);
    expect(r.record.choices.map((c) => c.label)).not.toContain('Acknowledge the summons and make your way to the Council Chamber');
  });
});

describe('A5, A6: the order arriving; "posted, not yet left"', () => {
  it('a skip stopped by a posting: the scene of the order, the trip and a day to settle affairs; no resume', { timeout: 60_000 }, () => {
    const r = resolveTurn(REGISTRY, base(), skip(5));
    const s = r.state;
    expect(s.duty.posting?.arrived).toBe(false);
    expect(r.draft.jump?.report.interrupted?.reason).toMatch(/^Posted to/);
    expect(describeJump(r.draft.jump!.report).join(' ')).toMatch(/short scene of the order arriving/);
    const labels = missionChoices(s).map((c) => c.label);
    expect(labels[0]).toMatch(/^Travel to /);
    expect(labels).toContain('Take a day to settle your affairs first');
    expect(selectDutyLine(s)).toMatch(/^Posted to .*, not yet left$/);
    const there = resolveTurn(REGISTRY, s, travel(s.duty.posting!.base.planet)).state;
    const later = resolveTurn(REGISTRY, there, intent({ actionType: 'rest', requestedSpan: { amount: 1, unit: 'hours' } })).state;
    expect(selectDutyLine(later)).not.toMatch(/not yet left/);
  });
});

describe('A7, A8: a front gives 2-5 days off; leave from the war\'s first posting', () => {
  it('at a forward base the gap is 2-5 days (9 in 10); the Temple cadence is unchanged', () => {
    const posted = resolveTurn(REGISTRY, base(), skip(3)).state;
    const there = resolveTurn(REGISTRY, posted, travel(posted.duty.posting!.base.planet)).state;
    const front = { ...there, duty: { ...there.duty, posting: { ...there.duty.posting!, arrived: true } } };
    const roll = missionRoll(front)!;
    expect(roll.median).toBe(MISSION_ROLL_FRONT.median);
    let left = 1;
    const p: number[] = [];
    for (let d = 1; d <= 8; d++) {
      const c = missionChance(d, roll.median, roll);
      p.push(left * c);
      left *= 1 - c;
    }
    const by = (d: number) => p.slice(0, d).reduce((a, b) => a + b, 0);
    expect(by(1)).toBe(0);
    expect(by(5)).toBeGreaterThan(0.9);
    expect(by(2)).toBeLessThan(0.25);
    expect(missionRoll(base())!.median).toBe(10);
  });

  it('a later posting in the same war keeps the leave clock', () => {
    const s0 = resolveTurn(REGISTRY, base(), skip(3)).state;
    const p = s0.duty.posting!;
    expect(s0.duty.leaveClock).toEqual({ warId: p.warId, nextLeaveDay: p.nextLeaveDay });
    const ended = ev(s0, [{ type: 'postingEnded', why: 'test' }]).state;
    const next = postingFor(ended, 0.99, 0, p.frontId)!;
    expect(next.nextLeaveDay).toBe(p.nextLeaveDay);
  });
});

describe('A9: a moderate wound while posted sends the character to the forward base, not the Temple', () => {
  it('sent back to the base; a severe wound evacuates to the Temple', { timeout: 60_000 }, () => {
    // A posting set by hand in 500 BBY, where no all-hands event runs (so a moderate wound does not carry on).
    let s = ev(peaceKnight(), [{ type: 'locationIntroduced', name: 'Devaron', kind: 'planet', region: 'Colonies', description: '', moveHere: true }]).state;
    const posting = { frontId: 'ggw.hydian', front: 'the Hydian Way front', warId: 'greatGalacticWar', base: { name: 'the fleet base at Devaron', planet: 'Devaron' }, sinceDay: s.clock.now.day, nextLeaveDay: s.clock.now.day + 100, arrived: true };
    s = ev(s, [{ type: 'postingAssigned', posting }]).state;
    const m = start(s, '/mission start strike Ord Mantell');
    expect(m.duty.mission!.base.planet).toBe('Devaron');
    const there = resolveTurn(REGISTRY, m, travel('Ord Mantell')).state;
    const back = missionAfterTurn(REGISTRY, hurt(there, wound('moderate')), null, false).state;
    expect(back.duty.status).toBe('home');
    expect(selectCurrentWorld(back)).toBe('Devaron');
    expect(back.duty.posting).not.toBeNull();
    const evac = missionAfterTurn(REGISTRY, hurt(there, wound('severe')), null, false).state;
    expect(evac.duty.posting).toBeNull();
    expect(selectCurrentWorld(evac)).toBe('Coruscant');
  });
});

describe("A10: the Council's best Masters are on a field path", () => {
  it('an archivist Master is not chained; a Guardian or Consular Master is', () => {
    expect(fieldPath('jediGuardian', '')).toBe(true);
    expect(fieldPath('jediConsular', '')).toBe(true);
    expect(fieldPath('scholar', '')).toBe(false);
    expect(fieldPath(null, 'jediMaster Chief librarian of the Jedi Archives')).toBe(false);
    expect(councilBestReason(base({ rank: 'master' }), 0)).toMatch(/field path/);
    const s = meet(base({ rank: 'padawan' }), [{ name: 'Master Nu', role: 'jediMaster', faction: 'jediOrder' }]);
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Master Nu')!.id;
    const archivist = { ...s, npcs: { ...s.npcs, byId: { ...s.npcs.byId, [id]: { ...s.npcs.byId[id]!, description: 'Chief Librarian of the Jedi Archives' } } } };
    expect(npcIsCouncilBest(s, id)).toBe(true);
    expect(npcIsCouncilBest(archivist, id)).toBe(false);
  });
});

describe('A12: all travel is the code\'s', () => {
  it("a plain trip moves the character in code; the narrator's move to another world is refused", () => {
    const s = peaceKnight();
    const r = resolveTurn(REGISTRY, s, travel('Alderaan'));
    expect(selectCurrentWorld(r.state)).toBe('Alderaan');
    expect(narratorMoveWorld(s, { type: 'locationIntroduced', name: 'Tython', kind: 'planet', region: 'Deep Core', description: '', moveHere: true } as never)).toBe('Tython');
    expect(narratorMoveWorld(s, { type: 'locationIntroduced', name: 'the Archives', kind: 'building', region: 'Coruscant', description: '', moveHere: true } as never)).toBeNull();
  });
});

describe('A13: leads found in play', () => {
  const onInvestigation = (): GameState => resolveTurn(REGISTRY, start(peaceKnight(), '/mission start investigation Alderaan'), travel('Alderaan')).state;

  it('a lead here adds a stage; a lead to another world adds the trip and a stage; at most two', () => {
    let s = onInvestigation();
    const n = s.duty.mission!.stages.length;
    s = ev(s, [{ type: 'missionLeadFound', lead: 'here', why: 'a dockworker saw the courier' }], 'ai').state;
    expect(s.duty.mission!.stages.length).toBe(n + 1);
    expect(s.duty.mission!.stages[s.duty.mission!.current + 1]!.label).toBe('follow the lead');
    s = ev(s, [{ type: 'missionLeadFound', lead: 'world', world: 'Corellia', why: 'the courier flew to Corellia' }], 'ai').state;
    expect(s.duty.mission!.stages.length).toBe(n + 3);
    expect(s.duty.mission!.stages[s.duty.mission!.current + 1]!.world).toBe('Corellia');
    expect(ev(s, [{ type: 'missionLeadFound', lead: 'here', why: 'more' }], 'ai').rejected).toHaveLength(1);
  });

  it('a lead past the job is a follow-up on the same thread when the mission succeeds; not on a strike', () => {
    let s = onInvestigation();
    s = ev(s, [{ type: 'missionLeadFound', lead: 'followUp', world: 'Corellia', why: 'the plot leads to Corellia' }], 'ai').state;
    expect(s.duty.mission!.followUp).toEqual({ world: 'Corellia', why: 'the plot leads to Corellia' });
    const thread = s.duty.mission!.threadTitle;
    for (let i = 0; i < 4; i++) s = ev(s, [{ type: 'missionStageResolved', success: true, why: 'x' }]).state;
    const at = { id: s.duty.mission!.id, outcome: null };
    while (s.duty.mission && s.duty.mission.outcome === null) s = ev(s, [{ type: 'missionStageResolved', success: true, why: 'x' }]).state;
    const next = missionAfterTurn(REGISTRY, s, null, false, at).state;
    expect(next.duty.mission?.targetWorld).toBe('Corellia');
    expect(next.duty.mission?.threadTitle).toBe(thread);
    const strike = resolveTurn(REGISTRY, start(peaceKnight(), '/mission start strike Alderaan'), travel('Alderaan')).state;
    expect(ev(strike, [{ type: 'missionLeadFound', lead: 'here', why: 'x' }], 'ai').rejected).toHaveLength(1);
    expect(MISSION_TYPES['investigation']).toBeDefined();
  });
});
