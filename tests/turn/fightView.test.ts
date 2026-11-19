// iPad test fixes (2026-11-18): D-181 the duel panel and the choice list agree (one source of truth: the combat slice;
// a bout's end keeps the session open; a finished fight shows its result and story choices), D-182 a stance is a
// setting (no exchange, no AI call, no time).
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import type { DuelState } from '../../src/engine/duel';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { AFTER_FIGHT_CHOICES, choicesAfterTurn, fightCalls, fightView } from '../../src/turn/fightChoices';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import type { TurnInput } from '../../src/turn/record';
import type { Choice } from '../../src/ai/schemas/compose';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const reply = (events: unknown[] = []) => ({
  narrative: 'Blades meet in a shower of sparks.',
  choices: [
    { label: 'Press the attack', intent: { actionType: 'fight' } },
    { label: 'Give ground', intent: { actionType: 'fight' } },
  ],
  scene: { moodTags: ['tense'] },
  events,
});
const many = (n: number, events: unknown[] = []): FixtureStep[] => Array.from({ length: n }, () => ({ callType: 'narrative' as const, data: reply(events) }));

function setup(steps: FixtureStep[]) {
  const provider = createFixtureProvider(steps);
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
  let ms = Date.UTC(2026, 10, 18);
  const deps: TurnDeps = { registry: REGISTRY, provider, router, storage: createMemoryStorage(), getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) };
  return { provider, deps };
}

function session(seed: string): Session {
  let state = createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed,
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - 30 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(60), forceSense: xpForLevel(55), endurance: xpForLevel(55), strength: xpForLevel(50), willpower: xpForLevel(55) },
    startingE: { soresu: { E: 50, eSpar: 15 } },
    rank: 'knight',
  });
  state = applyEvents(REGISTRY, state, [{ type: 'npcIntroduced', name: 'Bela Tor', species: 'human', faction: 'jediOrder', role: 'jediKnight', ageApprox: 32, description: '' }], { source: 'ai' }).state;
  return { state, history: [], campaign: { campaignId: 'c1', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } };
}
const partner = (s: Session) => Object.values(s.state.npcs.byId).find((n) => n.name === 'Bela Tor')!.id;
const beat = (action: string, extra: Record<string, unknown> = {}): TurnInput => ({ kind: 'beat', label: action, action: { action, ...extra } as never });
const pendingFight = (s: Session, stakes: string): Session => ({ ...s, state: applyEvents(REGISTRY, s.state, [{ type: 'combatStarted', opponentRefs: [partner(s)], stakes, terrainTags: ['flatFloor'] }], { source: 'ai' }).state });
const begun = (s: Session, stakes: string): Session => {
  const p = pendingFight(s, stakes);
  return { ...p, state: applyEvents(REGISTRY, p.state, [{ type: 'fightBegun', fromPending: true }], { source: 'engine' }).state };
};
const duelOf = (s: GameState): DuelState => (s.combat.active?.duel ?? (s.combat.last as unknown as { duel: DuelState }).duel) as DuelState;

describe('the duel panel and the choice list agree (D-181)', () => {
  it('a bout that ends while the session goes on keeps the fight and the panel open; the narration cannot end the session', async () => {
    let found = false;
    for (const seed of ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8']) {
      // Every narration also tries to end the fight (the iPad failure: a bout's point read as the end of the spar).
      const { deps } = setup(many(80, [{ type: 'combatEnded', reason: 'truce' }]));
      let t = await playTurn(deps, pendingFight(session(seed), 'spar'), beat('playBout'));
      for (let i = 0; i < 40 && t.session.state.combat.active?.session?.playing; i++) t = await playTurn(deps, t.session, beat('fightOn'));
      const active = t.session.state.combat.active;
      if (!active || active.beat !== 'boutEnded') continue;
      found = true;
      expect(active.session!.ended).toBeNull();
      expect(active.session!.bouts.length).toBeGreaterThan(0);
      expect(t.record.draft.combat?.ended).toBeNull();
      expect(t.record.rejected.some((r) => (r.event as { type?: string }).type === 'combatEnded')).toBe(true);
      // One source of truth: the panel is open, the narrator's choices are its suggestions, the story list is empty.
      const v = fightView(t.session.state, t.record, null);
      expect(v.inFight).toBe(true);
      expect(v.storyChoices).toEqual([]);
      expect(v.suggestions).toEqual(t.record.choices);
      expect(v.summary).toBeNull();
      // The next bout is there to play.
      const next = await playTurn(deps, t.session, beat('playBout'));
      const n = next.session.state.combat;
      expect(n.active ? n.active.session!.bouts.length >= active.session!.bouts.length : n.last?.session?.ended !== null).toBe(true);
      break;
    }
    expect(found).toBe(true);
  });

  it('the story can interrupt a session (combatEnded interrupted): it ends with the bouts so far', () => {
    const s = begun(session('int'), 'spar');
    const r = applyEvents(REGISTRY, s.state, [{ type: 'combatEnded', reason: 'interrupted', why: 'the Temple alarm sounds' }], { source: 'ai' });
    expect(r.rejected).toEqual([]);
    expect(r.state.combat.active).toBeNull();
    expect(r.state.combat.last?.session?.ended).toBe('stopped');
    expect(r.state.combat.last?.reason).toBe('sparring session (interrupted)');
    expect(applyEvents(REGISTRY, s.state, [{ type: 'truceOffered', why: 'x' }], { source: 'ai' }).rejected).toHaveLength(1);
    // Any other ending is refused while the session is on.
    for (const reason of ['truce', 'fled', 'surrendered']) expect(applyEvents(REGISTRY, s.state, [{ type: 'combatEnded', reason }], { source: 'ai' }).rejected).toHaveLength(1);
  });

  it('when the fight ends the choice list returns with story choices only, and the panel shows the result until closed', async () => {
    const { deps } = setup(many(4));
    const t = await playTurn(deps, begun(session('end'), 'skirmish'), beat('resolve'));
    expect(t.session.state.combat.active).toBeNull();
    expect(t.record.draft.combat?.ended).not.toBeNull();
    // The replies' choices were tactical moves (fight intents at no one): they did not survive the end of the fight.
    expect(t.record.choices).toEqual([...AFTER_FIGHT_CHOICES]);
    expect(t.record.draft.report.join(' ')).toMatch(/2 tactical choice\(s\) dropped/);
    const v = fightView(t.session.state, t.record, null);
    expect(v.inFight).toBe(false);
    expect(v.suggestions).toEqual([]);
    expect(v.storyChoices).toEqual(t.record.choices);
    expect(v.summary?.ended?.outcome).toBe(t.session.state.combat.last!.outcome);
    // Close hides the summary; the story choices stay.
    const closed = fightView(t.session.state, t.record, v.summary!.fightId);
    expect(closed.summary).toBeNull();
    expect(closed.storyChoices).toEqual(t.record.choices);
  });

  it('a finished sparring session shows its tally in the summary', async () => {
    const { deps } = setup(many(4));
    const t = await playTurn(deps, pendingFight(session('tally'), 'spar'), beat('continue'));
    expect(t.session.state.combat.active).toBeNull();
    const v = fightView(t.session.state, t.record, null);
    expect(v.summary?.session?.ended).not.toBeNull();
    expect(v.summary!.session!.won + v.summary!.session!.lost + v.summary!.session!.unfinished).toBe(t.session.state.combat.last!.session!.bouts.length);
  });

  it('while a fight is active the story list is always empty, quiet beats included', async () => {
    const { deps } = setup(many(30));
    let s = begun(session('quiet'), 'serious');
    for (let i = 0; i < 12 && s.state.combat.active; i++) {
      const t = await playTurn(deps, s, beat('continue'));
      s = t.session;
      const v = fightView(s.state, t.record, null);
      expect(v.inFight).toBe(s.state.combat.active !== null);
      if (v.inFight) expect(v.storyChoices).toEqual([]);
      else expect(v.suggestions).toEqual([]);
    }
  });

  it('choicesAfterTurn keeps choices during a fight and outside fights; a named target keeps a fight choice', () => {
    const s = session('keep');
    const tactical = reply().choices as Choice[];
    expect(choicesAfterTurn(s.state, false, tactical).choices).toEqual(tactical);
    expect(choicesAfterTurn(begun(s, 'serious').state, true, tactical).choices).toEqual(tactical);
    const named = [{ label: 'Challenge Bela again', intent: { actionType: 'fight' as const, targetRef: partner(s) } }, { label: 'Walk away', intent: { actionType: 'move' as const } }];
    expect(choicesAfterTurn(s.state, true, named)).toEqual({ choices: named, dropped: 0 });
  });
});

describe('the narrator cannot end a duel (D-181, every fight)', () => {
  for (const reason of ['truce', 'fled'] as const) {
    it(`an AI ${reason} in a duel's narration is rejected with a reason, and the duel goes on`, async () => {
      const { deps } = setup(many(6, [{ type: 'combatEnded', reason }]));
      const s = begun(session(`ai-${reason}`), 'serious');
      const t = await playTurn(deps, s, beat('narrate'));
      const rej = t.record.rejected.find((r) => (r.event as { type?: string }).type === 'combatEnded');
      expect(rej?.reason).toMatch(new RegExp(`the narrator cannot end a fight as ${reason}`));
      expect(t.session.state.combat.active).not.toBeNull();
      expect(t.record.draft.combat?.ended).toBeNull();
    });
  }
  it('an interruption with why ends it; the offered truce waits for the player', async () => {
    const { deps } = setup([...many(1, [{ type: 'truceOffered', why: 'the Sith offers to stand down' }]), ...many(4)]);
    const s = begun(session('ai-truce-offer'), 'serious');
    const t = await playTurn(deps, s, beat('narrate'));
    expect(t.session.state.combat.active?.truceOffer).toBe('the Sith offers to stand down');
    const acc = await playTurn(deps, t.session, beat('acceptTruce'));
    expect(acc.session.state.combat.active).toBeNull();
    expect(acc.session.state.combat.last?.outcome).toBe('truce');
    expect(acc.record.draft.combat?.ended?.outcome).toBe('truce');
  });
});

describe('a stance is a setting (D-182)', () => {
  it('setting the stance makes no turn: no exchange, no AI call, no time; it stays selected through the next actions', async () => {
    const { deps, provider } = setup(many(10));
    const s = begun(session('stance'), 'serious');
    const d0 = s.state.combat.active!.duel as DuelState;
    const set = applyEvents(REGISTRY, s.state, [{ type: 'stanceSet', stance: 'defensive' }], { source: 'player' });
    expect(set.rejected).toEqual([]);
    const d1 = set.state.combat.active!.duel as DuelState;
    expect(d1.a.stance).toBe('defensive');
    expect(d1.exchange).toBe(d0.exchange);
    expect(d1.log).toHaveLength(d0.log.length);
    expect(set.state.clock.now).toEqual(s.state.clock.now);
    expect(set.state.meta.turn).toBe(s.state.meta.turn);
    expect(set.state.meta.rngState).toEqual(s.state.meta.rngState);
    expect(provider.calls).toHaveLength(0);
    // Only an action resolves exchanges, in the stance set; it stays selected.
    let next: Session = { ...s, state: set.state };
    for (let i = 0; i < 3 && next.state.combat.active; i++) {
      next = (await playTurn(deps, next, beat('fightOn'))).session;
      expect(duelOf(next.state).a.stance).toBe('defensive');
    }
    expect(duelOf(next.state).log.length).toBeGreaterThan(0);
  });

  it('in a sparring session a stance neither starts nor resolves the session, and carries across bouts', async () => {
    const { deps } = setup(many(4));
    const s = begun(session('sstance'), 'spar');
    const r = applyEvents(REGISTRY, s.state, [{ type: 'stanceSet', stance: 'aggressive' }], { source: 'player' }).state;
    const active = r.combat.active!;
    expect(active.session?.playing).toBe(false);
    expect(active.session?.bouts).toHaveLength(0);
    expect((active.duel as DuelState).exchange).toBe(0);
    // Spar it out: every bout fights in the stance.
    const t = await playTurn(deps, { ...s, state: r }, beat('continue'));
    expect(t.session.state.combat.last?.session?.ended).not.toBeNull();
    expect(duelOf(t.session.state).a.stance).toBe('aggressive');
  });

  it('the stance is not a beat action any more, and only the player sets it', () => {
    const s = begun(session('nobeat'), 'serious');
    expect(applyEvents(REGISTRY, s.state, [{ type: 'combatAction', action: 'stance', stance: 'defensive' }], { source: 'player' }).rejected).toHaveLength(1);
    expect(applyEvents(REGISTRY, s.state, [{ type: 'stanceSet', stance: 'defensive' }], { source: 'ai' }).rejected).toHaveLength(1);
    expect(applyEvents(REGISTRY, session('none').state, [{ type: 'stanceSet', stance: 'defensive' }], { source: 'player' }).rejected).toHaveLength(1);
  });
});

describe('AI calls this fight (dev mode, iPad check)', () => {
  it('counts the calls of the turns of this fight only; quiet beats add none', async () => {
    const { deps } = setup(many(20));
    let s = begun(session('calls'), 'serious');
    const id = s.state.combat.active!.id;
    const records = [];
    for (let i = 0; i < 6 && s.state.combat.active; i++) {
      const t = await playTurn(deps, s, beat('continue'));
      records.push(t.record);
      s = t.session;
    }
    const expected = records.filter((r) => !r.draft.combat?.quiet).length;
    expect(fightCalls(s.history, id)).toBe(expected);
    expect(fightCalls(s.history, 'fight-none')).toBe(0);
    expect(records.filter((r) => r.draft.combat?.quiet).every((r) => r.calls.length === 0)).toBe(true);
  });
});

