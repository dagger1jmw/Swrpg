// m9-missions Part B (Jared, 27 Nov 2026; spec/missions.md): missions as the heart of play. A mission is code-owned and
// multi-turn: its record and stages, the approach rule and the stage checks, complications, travel moves, postings and leave in a
// total war, the Council's best and their chains, Padawans with their master, wounds, rewards, the narrator's lines and proposals,
// the mission card, the skip's stops, old saves, and a scripted mission played start to finish through the turn pipeline.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider } from '../../src/ai/fixtureProvider';
import { intentSchema } from '../../src/ai/schemas/intent';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { APPROACHES, MISSION_STANDING, MISSION_TYPES, STAGE_RULES, FRONTS } from '../../src/data/missions.config';
import { MENTION_ONLY, PLANETS } from '../../src/data/galaxyMap';
import { WARS } from '../../src/data/wars';
import { seedRng } from '../../src/engine/rng';
import type { Wound } from '../../src/engine/wounds';
import { dutyFeature } from '../../src/features/duty';
import { selectAtHome, selectHomeBase } from '../../src/features/duty/home';
import { approachFor, approachRating, buildMission, chainRoll, councilBestReason, migrateDutyV2, missionScaleFor, postingEligible, stageFromDef, woundVerdict } from '../../src/features/duty/missions';
import { selectMissionCard, selectMissionPromptLine, selectPostingCard } from '../../src/features/duty/selectors';
import { planDay } from '../../src/features/routines/scheduler';
import { selectStanding } from '../../src/features/ranks/selectors';
import { selectActiveRoutine } from '../../src/features/routines/selectors';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { runDevCommand } from '../../src/turn/devCommands';
import { missionChoices } from '../../src/turn/missionTurn';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import { resolveTurn } from '../../src/turn/resolve';
import narrativeInvestigate from '../fixtures/ai/narrative-investigate.json';
import { base, meet } from '../support/schemaSituations';

const ev = (s: GameState, events: object[], source: 'ai' | 'engine' | 'dev' = 'engine') => applyEvents(REGISTRY, s, events, { source });
const testChar = (s: GameState): GameState => ({ ...s, character: { ...s.character, testCharacter: true } });
const skip = (days: number) => intentSchema.parse({ actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: days >= 7 ? 'timeSkip' : 'montage', requestedSpan: { amount: days, unit: 'days' } });
const travel = (world: string) => intentSchema.parse({ actionType: 'travel', targets: [], references: [], unknownNames: [world] });
const other = intentSchema.parse({ actionType: 'other', targets: [], references: [], unknownNames: [] });
const withLevel = (s: GameState, id: string, xp: number): GameState => ({ ...s, progression: { ...s.progression, skills: { ...s.progression.skills, [id]: { ...(s.progression.skills[id] ?? {}), xp } } } }) as GameState;
const wound = (severity: Wound['severity'], part: Wound['part'] = 'leftArm'): Wound => ({ id: `w-${severity}`, part, severity, W: 20, stabilized: true, healProgress: 0, day: 0, source: 'test' }) as Wound;
const hurt = (s: GameState, w: Wound): GameState => ({ ...s, health: { ...s.health, wounds: [...s.health.wounds, w] as GameState['health']['wounds'] } });
/** A 500 BBY (peace) Jedi Knight, at the Temple. */
function peaceKnight(rank = 'knight'): GameState {
  const s0 = base({ rank });
  const day = s0.clock.now.day + Math.round((3661 - 500) * 368);
  const s = { ...s0, clock: { ...s0.clock, now: { ...s0.clock.now, day } }, duty: { ...s0.duty, since: day } };
  return runDevCommand(REGISTRY, testChar(s), '/home').state;
}
/** A mission started with the dev command (the code builds it as the daily roll would). */
const start = (s: GameState, cmd: string): GameState => {
  const r = runDevCommand(REGISTRY, testChar(s), cmd);
  expect(r.ok, r.line).toBe(true);
  return r.state;
};

describe('B1, B2: the mission record and the types', () => {
  it('a mission is code-owned: the narrator can neither assign, advance nor end one', { timeout: 60_000 }, () => {
    const s = start(peaceKnight(), '/mission start strike Ord Mantell');
    const m = s.duty.mission!;
    expect(m.type).toBe('strike');
    expect(m.targetWorld).toBe('Ord Mantell');
    expect(m.stages.map((x) => x.label)).toEqual(['get in', 'reach the target', 'the job', 'get out']);
    expect(m.phase).toBe('outbound');
    expect(m.threadTitle).toMatch(/^Mission: a strike on Ord Mantell/);
    for (const e of [{ type: 'missionAssigned', mission: m }, { type: 'missionStageResolved', success: true, why: 'x' }, { type: 'missionArrived', where: 'target' }, { type: 'missionEnded', how: 'x' }, { type: 'missionOutcome', outcome: 'success', why: 'x' }]) {
      expect(ev(s, [e], 'ai').rejected, e.type).toHaveLength(1);
    }
  });

  it('every type has 2-6 stages; the approaches are known; the fronts and worlds are on the map', { timeout: 60_000 }, () => {
    for (const t of Object.values(MISSION_TYPES)) {
      expect(t.stages.length, t.id).toBeGreaterThanOrEqual(2);
      expect(t.stages.length, t.id).toBeLessThanOrEqual(6);
      for (const st of t.stages) for (const a of st.approaches ?? []) expect(a in APPROACHES, `${t.id}.${st.id}.${a}`).toBe(true);
    }
    for (const f of FRONTS) {
      expect([...PLANETS, ...MENTION_ONLY].some((p) => p.name === f.world), f.id).toBe(true);
      expect(WARS.find((w) => w.id === f.warId)?.intensity, f.id).toBe('total');
    }
  });
});

describe('B3: how a stage is decided', () => {
  const stage = stageFromDef(MISSION_TYPES['infiltration']!.stages[0]!);
  it("the check rule: the code's choice, else the intent's skill, else its action; otherwise none", { timeout: 60_000 }, () => {
    expect(approachFor(stage, null, 'persuade', true)).toBe('persuade');
    expect(approachFor(stage, { actionType: 'other', skillId: 'stealth' }, null, true)).toBe('stealth');
    expect(approachFor(stage, { actionType: 'investigate' }, null, true)).toBe('investigate');
    expect(approachFor(stage, { actionType: 'dialogue' }, null, true)).toBe('persuade');
    expect(approachFor(stage, { actionType: 'fight', targets: [] }, null, true)).toBe('fight');
    expect(approachFor(stage, { actionType: 'rest' }, null, true)).toBeNull();
    expect(approachFor(stage, { actionType: 'other', skillId: 'forceSense' }, null, false)).toBeNull(); // the Force for Force users only
  });

  it('a poor fit and each complication make it harder', { timeout: 60_000 }, () => {
    expect(approachRating(stage, 'persuade')).toEqual({ rating: stage.rating, fit: true });
    expect(approachRating(stage, 'pilot').rating).toBe(stage.rating + STAGE_RULES.poorFit);
    expect(approachRating({ ...stage, harder: 2 }, 'persuade').rating).toBe(stage.rating + 2 * STAGE_RULES.harderPerComplication);
  });

  it('a success moves the stage on; a failure brings a complication; a bad failure inserts a stage; the code fails the mission only past its complications', { timeout: 60_000 }, () => {
    let s = start(peaceKnight(), '/mission start investigation Alderaan');
    s = ev(s, [{ type: 'missionArrived', where: 'target' }]).state;
    s = ev(s, [{ type: 'missionStageResolved', success: true, why: 'ok' }]).state;
    expect(s.duty.mission!.current).toBe(1);
    s = ev(s, [{ type: 'missionStageResolved', success: false, why: 'no', complication: 'a witness disappears' }]).state;
    expect(s.duty.mission!.complications).toEqual(['a witness disappears']);
    expect(s.duty.mission!.stages[1]!.harder).toBe(1);
    const n = s.duty.mission!.stages.length;
    s = ev(s, [{ type: 'missionStageResolved', success: false, why: 'bad', complication: 'the plotters move first', insert: true }]).state;
    expect(s.duty.mission!.stages.length).toBe(n + 1);
    expect(s.duty.mission!.stages[1]!.kind).toBe('fight');
    expect(s.duty.mission!.outcome).toBeNull();
    s = ev(s, [{ type: 'missionStageResolved', success: false, why: 'worst', complication: 'x', failMission: true }]).state;
    expect(s.duty.mission!.outcome).toBe('failure');
    expect(s.duty.mission!.phase).toBe('return');
  });

  it("a turn's approach rolls the check in code, and its hours pass", { timeout: 60_000 }, () => {
    let s = start(peaceKnight(), '/mission start recon Alderaan');
    s = ev(s, [{ type: 'locationIntroduced', name: 'Alderaan', kind: 'planet', region: 'Core Worlds', description: '', moveHere: true }, { type: 'missionArrived', where: 'target' }]).state;
    const r = resolveTurn(REGISTRY, s, other, { mission: 'stealth' });
    expect(r.draft.checks).toHaveLength(1);
    expect(r.draft.checks[0]!.skillId).toBe('stealth');
    expect(r.draft.timeAdvanced!.seconds).toBeGreaterThan(0);
    expect(r.state.duty.mission!.stages[0]!.progress + r.state.duty.mission!.complications.length).toBe(1);
  });

  it('a fight stage is a real fight: the combat engine decides it', { timeout: 60_000 }, () => {
    let s = start(peaceKnight(), '/mission start strike Alderaan');
    s = ev(s, [{ type: 'missionArrived', where: 'target' }, { type: 'missionStageResolved', success: true, why: 'in' }]).state;
    const r = resolveTurn(REGISTRY, s, other, { mission: 'go' });
    expect(r.state.combat.active).not.toBeNull();
    expect(r.state.duty.mission!.stages[1]!.fightId).toBe(r.state.combat.active!.id);
  });
});

describe('B4: travel', () => {
  it('setting out is a code move by the travel rules: time passes by the route; the character arrives at the target in code', { timeout: 60_000 }, () => {
    const s = start(peaceKnight(), '/mission start diplomacy Alderaan');
    const r = resolveTurn(REGISTRY, s, travel('Alderaan'));
    expect(r.draft.timeAdvanced!.seconds).toBeGreaterThan(3600);
    expect(r.state.duty.mission!.phase).toBe('onSite');
    expect(r.state.locations.byId[r.state.locations.currentId!]!.name).toBe('Alderaan');
    expect(missionChoices(r.state).every((c) => c.intent.missionApproach)).toBe(true);
  });

  it('coming back to base with the work done ends the mission; the next day is a home day', { timeout: 60_000 }, () => {
    let s = start(peaceKnight(), '/mission start recon Alderaan');
    s = resolveTurn(REGISTRY, s, travel('Alderaan')).state;
    s = ev(s, [{ type: 'missionOutcome', outcome: 'success', why: 'done' }]).state;
    expect(missionChoices(s)[0]!.label).toMatch(/^Head back to the Jedi Temple/);
    const r = resolveTurn(REGISTRY, s, travel('Coruscant'));
    expect(r.state.duty.status).toBe('home');
    expect(r.state.duty.history.at(-1)?.outcome).toBe('success');
    expect(r.state.duty.homeDay).toBe(r.state.clock.now.day + 1);
    expect(selectAtHome(r.state)).toBe(true);
  });
});

describe('B5: war intensity and postings', () => {
  it('in a total war a Knight is posted; the forward base is home; in peace no posting', { timeout: 60_000 }, () => {
    const war = resolveTurn(REGISTRY, base(), skip(3)).state;
    expect(war.duty.posting).not.toBeNull();
    expect(selectHomeBase(war)!.name).toBe(war.duty.posting!.base.name);
    expect(selectPostingCard(war)!.front).toBe(war.duty.posting!.front);
    expect(missionChoices(war)[0]!.label).toMatch(/^Travel to /);
    const peace = resolveTurn(REGISTRY, peaceKnight(), skip(3)).state;
    expect(peace.duty.posting).toBeNull();
  });

  it('leave: a trip home after the leave day, the Temple home until it ends; the posting ends with its front', { timeout: 60_000 }, () => {
    const posted0 = resolveTurn(REGISTRY, base(), skip(3)).state;
    const p = posted0.duty.posting!;
    const posted = resolveTurn(REGISTRY, posted0, travel(p.base.planet)).state;
    expect(selectAtHome(posted)).toBe(true);
    const due = { ...posted, duty: { ...posted.duty, posting: { ...p, nextLeaveDay: posted.clock.now.day } } };
    const leave = resolveTurn(REGISTRY, due, skip(2)).state;
    expect(leave.duty.leave).not.toBeNull();
    expect(selectHomeBase(leave)!.name).toMatch(/Temple/);
    expect(missionChoices(leave)[0]!.label).toMatch(/^Go home on leave/);
    const gone = { ...posted, duty: { ...posted.duty, posting: { ...p, frontId: 'ggw.rhenvar' } } };
    expect(resolveTurn(REGISTRY, gone, skip(2)).state.duty.posting?.frontId ?? null).not.toBe('ggw.rhenvar');
  });

  it("a posting's missions are local: the front's world or one near it", { timeout: 60_000 }, () => {
    let s = resolveTurn(REGISTRY, base(), skip(3)).state;
    s = ev(s, [{ type: 'locationIntroduced', name: s.duty.posting!.base.planet, kind: 'planet', region: 'Colonies', description: '', moveHere: true }]).state;
    const built = buildMission(s, { type: MISSION_TYPES['strike']!, world: s.duty.posting!.base.planet, base: s.duty.posting!.base, id: 'mx', here: s.duty.posting!.base.planet }, seedRng('x'));
    expect(built.mission.phase).toBe('onSite');
  });
});

describe("B6: the Council's best", () => {
  it('a Master, or a Knight with top-tier combat, or with standing and a strong record', { timeout: 60_000 }, () => {
    expect(councilBestReason(base({ rank: 'master' }), 0)).toMatch(/Master/);
    expect(councilBestReason(base(), 0)).toBeNull();
    expect(councilBestReason(withLevel(base(), 'soresu', 72 * 72 * 100), 0)).toMatch(/top-tier combat/);
    const record = { ...base(), duty: { ...base().duty, record: { missions: 8, successes: 7, failures: 1, cutShort: 0, chains: 0, standing: 10 } } };
    expect(councilBestReason(record, 75)).toMatch(/record/);
    expect(councilBestReason(record, 60)).toBeNull();
  });

  it('sent straight on: likely for the best, never for the rest; a follow-up continues the thread', { timeout: 60_000 }, () => {
    let s = start(peaceKnight('master'), '/mission start investigation Alderaan');
    s = ev(s, [{ type: 'missionOutcome', outcome: 'success', why: 'done' }]).state;
    expect(chainRoll(s, false, 0, 0, false)).toBeNull();
    expect(chainRoll(s, true, 0.1, 0.9, false)).toBe('followUp');
    expect(chainRoll(s, true, 0.99, 0.9, false)).toBeNull();
    // Played: a Master finishing the work is often sent on (a seed where the roll comes up).
    let chained = 0;
    for (let i = 0; i < 12; i++) {
      let t = start(withLevel(peaceKnight('master'), 'stealth', 80 * 80 * 100), '/mission start recon Alderaan');
      t = { ...t, meta: { ...t.meta, rngState: seedRng(`chain-${i}`) } };
      t = resolveTurn(REGISTRY, t, travel('Alderaan')).state;
      t = ev(t, [{ type: 'missionStageResolved', success: true, why: 'a' }, { type: 'missionStageResolved', success: true, why: 'b' }, { type: 'missionStageResolved', success: true, why: 'c' }]).state;
      const r = resolveTurn(REGISTRY, t, other, { mission: 'stealth' });
      if (r.state.duty.record.chains > 0) {
        chained++;
        expect(r.state.duty.mission!.chainLength).toBe(1);
        expect(r.state.duty.status).toBe('mission');
      }
    }
    expect(chained).toBeGreaterThan(0);
  });
});

describe('B7: Padawans go where their master goes', () => {
  const withMaster = (role: string): GameState => {
    const s = meet(base({ rank: 'padawan' }), [{ name: 'Master Ilo', role, faction: 'jediOrder' }]);
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Master Ilo')!.id;
    return { ...s, ranks: { ...s.ranks, masterId: id } };
  };
  it("the master's scale, the master on the mission, posted with a Knight or Master", { timeout: 60_000 }, () => {
    const s = withMaster('jediMaster');
    expect(missionScaleFor(s, 1.2)).toBe(1.2);
    expect(missionScaleFor(withMaster('jediKnight'), 1.2)).toBe(1);
    expect(postingEligible(s)).toBe(true);
    expect(postingEligible(base({ rank: 'padawan' }))).toBe(false);
    expect(councilBestReason(s, 0)).toMatch(/your master/);
    const m = start(s, '/mission start recon Alderaan').duty.mission!;
    expect(m.party.masterId).toBe(s.ranks.masterId);
    expect(selectMissionCard(start(s, '/mission start recon Alderaan'))!.party).toEqual(['Master Ilo']);
  });
});

describe('B8: wounds on a mission', () => {
  it('severe or worse: evacuated; moderate: carries on only in all hands; minor carries on', { timeout: 60_000 }, () => {
    expect(woundVerdict([wound('severe')], true)?.what).toBe('evacuate');
    expect(woundVerdict([wound('moderate')], false)?.what).toBe('sendBack');
    expect(woundVerdict([wound('moderate')], true)).toBeNull();
    expect(woundVerdict([wound('minor')], false)).toBeNull();
  });

  it('a severe wound on site: evacuated home, the mission cut short, the posting ended', { timeout: 60_000 }, () => {
    let s = resolveTurn(REGISTRY, base(), skip(3)).state;
    s = start(s, '/mission start strike Alderaan');
    s = resolveTurn(REGISTRY, s, travel('Alderaan')).state;
    const r = resolveTurn(REGISTRY, hurt(s, wound('severe', 'torso')), skip(1));
    expect(r.state.duty.status).toBe('home');
    expect(r.state.duty.history.at(-1)?.outcome).toBe('cutShort');
    expect(r.state.duty.posting).toBeNull();
    expect(selectAtHome(r.state)).toBe(true);
  });
});

describe('B9: rewards', () => {
  it('standing rises with success and falls with failure; the record counts them', { timeout: 60_000 }, () => {
    const s = start(peaceKnight(), '/mission start recon Alderaan');
    const won = runDevCommand(REGISTRY, s, '/mission end success').state;
    expect(won.duty.record).toMatchObject({ missions: 1, successes: 1, standing: MISSION_STANDING.success });
    expect(selectStanding(won) - selectStanding(s)).toBeCloseTo(MISSION_STANDING.success, 6);
    const lost = runDevCommand(REGISTRY, start(won, '/mission start recon Alderaan'), '/mission end failure').state;
    expect(lost.duty.record.standing).toBe(MISSION_STANDING.success + MISSION_STANDING.failure);
  });
});

describe('B10, B11: the narrator, the card, the skip', () => {
  it("the MISSION line names the stage and says the narrator never resolves, moves or ends; the card shows the stages", { timeout: 60_000 }, () => {
    let s = start(peaceKnight(), '/mission start rescue Alderaan');
    s = ev(s, [{ type: 'missionArrived', where: 'target' }]).state;
    expect(selectMissionPromptLine(s)).toMatch(/^MISSION \(the code's: narrate this stage only; never resolve a stage, move the character between worlds or end the mission/);
    expect(selectMissionPromptLine(s)).toMatch(/locate them/);
    expect(dutyFeature.promptSection!(s)).toMatch(/MISSION/);
    const card = selectMissionCard(s)!;
    expect(card.stages[0]).toEqual({ label: 'locate them', status: 'active' });
    expect(card.deadline).toMatch(/days left/);
  });

  it("the narrator's proposal goes through the code: checked, then assigned by the code", { timeout: 60_000 }, () => {
    const s = peaceKnight();
    expect(ev(s, [{ type: 'missionProposed', missionType: 'investigation', world: 'Nowhere Prime', why: 'a lead' }], 'ai').rejected).toHaveLength(1);
    const ok = ev(s, [{ type: 'missionProposed', missionType: 'investigation', world: 'Taris', why: 'the smuggler named a buyer on Taris' }], 'ai');
    expect(ok.rejected).toHaveLength(0);
    expect(ok.state.duty.status).toBe('home');
    const r = resolveTurn(REGISTRY, ok.state, skip(2));
    expect(r.state.duty.mission?.targetWorld).toBe('Taris');
    expect(r.state.duty.mission?.threadTitle).toMatch(/smuggler named a buyer/);
    expect(ev(r.state, [{ type: 'missionProposed', missionType: 'recon', world: 'Taris', why: 'again' }], 'ai').rejected).toHaveLength(1);
  });

  it('a skip on a mission stops at the stage that needs the player; a mission day is never a free day', { timeout: 60_000 }, () => {
    let s = start(peaceKnight(), '/mission start recon Alderaan');
    s = resolveTurn(REGISTRY, s, travel('Alderaan')).state;
    const r = resolveTurn(REGISTRY, s, skip(10));
    expect(r.draft.timeAdvanced?.interrupted).toMatch(/^The mission needs you: the approach/);
    expect(r.state.clock.now.day - s.clock.now.day).toBeLessThanOrEqual(1);
    const routine = { ...selectActiveRoutine(s), daysPerWeek: 0.0001 };
    expect(planDay(s, routine, {}).trainingDay).toBe(true);
    expect(planDay(peaceKnight(), routine, {}).trainingDay).toBe(false);
  });
});

describe('B12: saves', () => {
  it('an opt-2 save mid-mission migrates to a mission record', { timeout: 60_000 }, () => {
    const env = JSON.parse(readFileSync('tests/fixtures/saves/opt-2.json', 'utf8'));
    env.featureVersions.duty = 1;
    env.state.duty = { status: 'mission', since: env.state.duty.since, mission: { title: 'Mission: a strike mission', threadTitle: 'Mission: a strike mission', assignedDay: env.state.duty.since, leftHome: false }, homeDay: null, resume: null, home: null, log: [] };
    const r = loadEnvelope(REGISTRY, env);
    expect(r.ok).toBe(true);
    const st = (r as { ok: true; state: GameState }).state;
    expect(st.duty.mission!.type).toBe('strike');
    expect(st.duty.mission!.phase).toBe('outbound');
    expect(st.duty.record.missions).toBe(0);
    expect(migrateDutyV2({ status: 'home', since: 0, mission: null, homeDay: null, resume: null, home: null, log: [] }).mission).toBeNull();
  });

  it('the mid-mission fixture loads and plays on', { timeout: 60_000 }, () => {
    const r = loadEnvelope(REGISTRY, JSON.parse(readFileSync('tests/fixtures/saves/m9-missions-mid.json', 'utf8')));
    expect(r.ok).toBe(true);
    const st = (r as { ok: true; state: GameState }).state;
    expect(st.duty.status).toBe('mission');
    expect(missionChoices(st).length).toBeGreaterThan(0);
  });

  it('a save made now round-trips the mission', { timeout: 60_000 }, () => {
    const s = start(peaceKnight(), '/mission start manhunt Alderaan');
    const r = loadEnvelope(REGISTRY, JSON.parse(JSON.stringify(makeEnvelope(REGISTRY, s, 'x'))));
    expect((r as { ok: true; state: GameState }).state.duty.mission).toEqual(s.duty.mission);
  });
});

describe('C: a scripted mission start to finish through the turn pipeline (stubbed narrator)', () => {
  it('the stages, a complication, the travel days and the end at home', { timeout: 60_000 }, async () => {
    const provider = createFixtureProvider(Array.from({ length: 200 }, () => ({ data: narrativeInvestigate })));
    const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
    const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
    const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
    let ms = Date.UTC(2026, 10, 27);
    const deps: TurnDeps = { registry: REGISTRY, provider, router, storage: createMemoryStorage(), getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) };
    // An unskilled Knight (Stealth 0) on a recon: the first approach often fails, so a complication comes.
    // A Knight who can fight (Soresu 65) but has no Stealth: the first approach often fails, so a complication comes.
    let s = start(withLevel(withLevel(peaceKnight(), 'soresu', 65 * 65 * 100), 'agility', 60 * 60 * 100), '/mission start recon Taris');
    s = { ...s, meta: { ...s.meta, rngState: seedRng('scripted-1') } };
    let session: Session = { state: s, history: [], campaign: { campaignId: 'c', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } };
    const t0 = session.state.clock.now.day;
    const log: string[] = [];
    let travelDays = 0;
    for (let i = 0; i < 60 && session.state.duty.status === 'mission'; i++) {
      const st = session.state;
      if (st.combat.active) {
        session = (await playTurn(deps, session, { kind: 'beat', action: { action: 'resolve' }, label: 'Resolve' })).session;
        continue;
      }
      const choices = missionChoices(st);
      expect(choices.length, `turn ${i}: the code offers the mission's choices`).toBeGreaterThan(0);
      const c = choices[0]!;
      const before = st.clock.now.day;
      const r = await playTurn(deps, session, { kind: 'choice', choice: c });
      session = r.session;
      // The code's choices come first in the record (the narrator's follow).
      if (session.state.duty.status === 'mission' && !session.state.combat.active) expect(r.record.choices[0]?.label).toBe(missionChoices(session.state)[0]?.label);
      if (c.intent.actionType === 'travel') travelDays += session.state.clock.now.day - before;
      log.push(`${c.label} -> ${session.state.duty.mission ? `${session.state.duty.mission.phase} ${session.state.duty.mission.current}` : 'ended'}`);
    }
    const h = session.state.duty.history.at(-1)!;
    expect(session.state.duty.status, log.join('\n')).toBe('home');
    expect(selectAtHome(session.state), `${log.join(' / ')} | ${JSON.stringify(session.state.duty.log.slice(-4))} at ${session.state.locations.byId[session.state.locations.currentId!]?.name}`).toBe(true);
    expect(travelDays).toBeGreaterThanOrEqual(2);
    expect(log.some((l) => /^Set out for Taris/.test(l))).toBe(true);
    expect(log.some((l) => /^Head back/.test(l)), log.join(' / ') + JSON.stringify(session.state.duty.log.slice(-5))).toBe(true);
    expect(session.state.duty.log.some((l) => l.what.startsWith('complication:')), log.join('\n')).toBe(true);
    expect(h.endDay - t0).toBeGreaterThan(1);
    expect(['success', 'failure']).toContain(h.outcome);
  });
});
