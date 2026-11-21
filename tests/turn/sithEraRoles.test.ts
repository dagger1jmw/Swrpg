// D-320 (lore batch 2026-11-21; D-311): from 1,000 BBY to 25 ABY only the Rule of Two pair are Sith. A generic
// (non-canon) NPC introduced as a Sith Lord or Sith acolyte in those years becomes a Dark Jedi or Dark Acolyte; Dark
// Acolytes exist only 22-19 BBY and Inquisitors only 19 BBY-11 ABY, otherwise Dark Jedi (any era). Named canon Sith keep
// their role. The new roles use the Sith numbers and keep the original rank, so balance does not change.
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { calibrate, type TokenRatios } from '../../src/ai/tokenRatio';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { moraleFor, withdrawChanceFor } from '../../src/data/combat.config';
import { minionKindForYear, ROLE_ARCHETYPES, roleForYear } from '../../src/data/npcGen.config';
import type { CalendarDate } from '../../src/engine/calendar';
import { rollNpcInputs } from '../../src/engine/npcGen';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { playTurn, type TurnDeps } from '../../src/turn/pipeline';
import { devCharacter } from '../support/fightHarness';

describe('the role-by-era table (D-320)', () => {
  it.each([
    ['sithLord', -3661, 'sithLord'],
    ['sithLord', -1000, 'sithLord'],
    ['sithLord', -500, 'darkJedi'],
    ['sithLord', 4, 'darkJedi'],
    ['sithLord', 24, 'darkJedi'],
    ['sithLord', 25, 'sithLord'],
    ['sithLord', 130, 'sithLord'],
    ['sithAcolyte', -3661, 'sithAcolyte'],
    ['sithAcolyte', -500, 'darkJedi'],
    ['sithAcolyte', -22, 'darkAcolyte'],
    ['sithAcolyte', -19, 'darkAcolyte'],
    ['sithAcolyte', -18, 'darkJedi'],
    ['darkAcolyte', -20, 'darkAcolyte'],
    ['darkAcolyte', -3661, 'darkJedi'],
    ['inquisitor', -19, 'inquisitor'],
    ['inquisitor', 11, 'inquisitor'],
    ['inquisitor', 12, 'darkJedi'],
    ['inquisitor', -22, 'darkJedi'],
    ['inquisitor', -3661, 'darkJedi'],
    ['darkJedi', -3661, 'darkJedi'],
    ['darkJedi', 10, 'darkJedi'],
    ['jediKnight', -500, 'jediKnight'],
    ['soldier', 10, 'soldier'],
  ])('%s in %i -> %s', (role, year, want) => {
    expect(roleForYear(role, year).role).toBe(want);
  });
  it('the note says what changed and why', () => {
    expect(roleForYear('sithLord', -500).note).toBe('no Sith Lord in 500 BBY: a Dark Jedi instead (D-320; only the Rule of Two Master and apprentice are Sith in these years)');
    expect(roleForYear('inquisitor', -3661).note).toBe('no Inquisitor in 3661 BBY: a Dark Jedi instead (D-320)');
    expect(roleForYear('sithLord', -3661).note).toBeNull();
  });
  it('Sith acolyte minions follow the same chain', () => {
    expect(minionKindForYear('sithAcolyte', -3661).kind).toBe('sithAcolyte');
    expect(minionKindForYear('sithAcolyte', -20).kind).toBe('darkAcolyte');
    expect(minionKindForYear('sithAcolyte', -500)).toEqual({ kind: 'darkJedi', note: 'no Sith acolytes in 500 BBY: Dark Jedi instead (D-213)' });
    expect(minionKindForYear('darkAcolyte', 10).kind).toBe('darkJedi');
  });
});

describe('balance does not change (D-320)', () => {
  it('the new roles draw the Sith archetypes, so morale and withdrawal are the Sith rules', () => {
    for (const role of ['darkJedi', 'darkAcolyte', 'inquisitor']) expect(ROLE_ARCHETYPES[role]).toEqual(ROLE_ARCHETYPES['sithLord']);
    for (const a of ['sithWarrior', 'sithInquisitor']) {
      expect(moraleFor(a)).toEqual({ group: 'late', surrender: 0.2 });
      expect(withdrawChanceFor(a)).toBe(0.3);
    }
  });
  it.each([
    ['sithLord', 'darkJedi'],
    ['sithAcolyte', 'darkAcolyte'],
    ['sithAcolyte', 'darkJedi'],
  ])('a %s corrected to %s generates exactly as before (same archetype, talents, rank, start age)', (from, to) => {
    for (const npcId of ['npc:a', 'npc:b', 'npc:c', 'npc:d']) {
      const base = { campaignSeed: 'seed', npcId, faction: 'sith', age: 30, year: -500 };
      expect(rollNpcInputs({ ...base, role: to, rankRole: from })).toEqual(rollNpcInputs({ ...base, role: from }));
    }
  });
});

describe('the engine correction event (D-320)', () => {
  const at = async (year: number): Promise<GameState> => devCharacter('knight', 30, { year, month: 1, day: 1 });
  const introduce = (s: GameState, name: string, role: string): { s: GameState; id: string } => {
    const r = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name, species: 'human', faction: 'sith', role, ageApprox: 35, description: 'a dark-side warrior' }], { source: 'ai' });
    return { s: r.state, id: Object.values(r.state.npcs.byId).find((n) => n.name === name)!.id };
  };
  it('corrects an out-of-era Sith acolyte to a Dark Jedi with the acolyte rank kept', async () => {
    const { s, id } = introduce(await at(-500), 'Hooded Acolyte', 'sithAcolyte');
    const r = applyEvents(REGISTRY, s, [{ type: 'npcRoleEraCorrected', npcRef: id }], { source: 'engine' });
    expect(r.rejected).toEqual([]);
    expect(r.state.npcs.byId[id]).toMatchObject({ role: 'darkJedi', rankRole: 'sithAcolyte' });
    expect(r.applied.flatMap((a) => a.notes ?? [])).toContain('Hooded Acolyte: no Sith acolyte in 500 BBY: a Dark Jedi instead (D-320; only the Rule of Two Master and apprentice are Sith in these years)');
  });
  it('refuses an in-era role and a canon figure', async () => {
    const inEra = introduce(await at(-3661), 'Imperial Lord', 'sithLord');
    expect(applyEvents(REGISTRY, inEra.s, [{ type: 'npcRoleEraCorrected', npcRef: inEra.id }], { source: 'engine' }).rejected).toHaveLength(1);
    const canon = introduce(await at(-32), 'Darth Maul', 'sithLord');
    const linked = applyEvents(REGISTRY, canon.s, [{ type: 'npcCanonLinked', npcRef: canon.id, canonId: 'lore:darth-maul' }], { source: 'engine' }).state;
    const r = applyEvents(REGISTRY, linked, [{ type: 'npcRoleEraCorrected', npcRef: canon.id }], { source: 'engine' });
    expect(r.rejected).toHaveLength(1);
    expect(r.state.npcs.byId[canon.id]!.role).toBe('sithLord');
  });
  it('the narrator cannot send it', async () => {
    const { s, id } = introduce(await at(-500), 'Hooded Lord', 'sithLord');
    expect(applyEvents(REGISTRY, s, [{ type: 'npcRoleEraCorrected', npcRef: id }], { source: 'ai' }).rejected).toHaveLength(1);
  });
});

describe('through the turn pipeline (D-320)', () => {
  function deps(steps: FixtureStep[]): TurnDeps {
    const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog, ratios: {} as TokenRatios };
    const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
    let ms = Date.UTC(2026, 10, 21, 20, 0);
    return {
      registry: REGISTRY,
      provider: createFixtureProvider(steps),
      storage: createMemoryStorage(),
      getSettings,
      router: createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => ms }),
      wallClock: () => {
        ms += 1000;
        return { ms, iso: new Date(ms).toISOString() };
      },
      getTokenRatios: () => store.ratios,
      recordTokenRatio: (model, chars, tokens) => (store.ratios = calibrate(store.ratios, model, chars, tokens)),
    };
  }
  const npc = (key: string, name: string, role: string) => ({ type: 'npcIntroduced', key, name, species: 'human', faction: 'sith', role, ageApprox: 30, description: 'a dark figure' });
  async function opening(startDate: CalendarDate, events: unknown[]): Promise<GameState> {
    const d = deps([
      {
        callType: 'narrative',
        data: {
          narrative: 'Hooded figures wait in the dark.',
          choices: [
            { label: 'Wait', intent: { actionType: 'rest' } },
            { label: 'Look around', intent: { actionType: 'investigate' } },
          ],
          scene: { moodTags: ['tense'], presentNpcRefs: [] },
          events: [...events, { type: 'timeElapsed', seconds: 30, reason: 'a moment' }],
        },
      },
    ]);
    const session = await createCampaign(d.registry, d.storage, { name: 'Kael Varn', birthDate: { year: startDate.year - 20, month: 3, day: 4 }, startDate, startSecond: DEFAULT_START_SECOND }, { campaignId: 'camp-d320', branchId: 'b' }, '2026-11-21T00:00:00.000Z');
    const { session: after, record } = await playTurn(d, session, { kind: 'opening', premise: '' });
    expect(record.rejected).toEqual([]);
    return after.state;
  }
  const byName = (s: GameState, name: string) => Object.values(s.npcs.byId).find((n) => n.name === name)!;

  it('32 BBY: a generic Sith Lord becomes a Dark Jedi; Darth Maul stays a Sith Lord, linked to canon', async () => {
    const s = await opening({ year: -32, month: 1, day: 1 }, [npc('tmp:1', 'Hooded Marauder', 'sithLord'), npc('tmp:2', 'Darth Maul', 'sithLord')]);
    expect(byName(s, 'Hooded Marauder')).toMatchObject({ role: 'darkJedi', rankRole: 'sithLord', canonId: null });
    expect(byName(s, 'Darth Maul')).toMatchObject({ role: 'sithLord', canonId: 'lore:darth-maul' });
    expect(byName(s, 'Darth Maul').rankRole).toBeUndefined();
  });
  it('4 ABY: an Inquisitor stays one; a Sith acolyte becomes a Dark Jedi', async () => {
    const s = await opening({ year: 4, month: 1, day: 1 }, [npc('tmp:1', 'Grey Inquisitor', 'inquisitor'), npc('tmp:2', 'Young Acolyte', 'sithAcolyte')]);
    expect(byName(s, 'Grey Inquisitor').role).toBe('inquisitor');
    expect(byName(s, 'Young Acolyte')).toMatchObject({ role: 'darkJedi', rankRole: 'sithAcolyte' });
  });
  it('3,661 BBY: Sith roles are untouched; an Inquisitor or Dark Acolyte becomes a Dark Jedi', async () => {
    const s = await opening({ year: -3661, month: 1, day: 1 }, [npc('tmp:1', 'Imperial Lord', 'sithLord'), npc('tmp:2', 'Korriban Acolyte', 'sithAcolyte'), npc('tmp:3', 'Odd Inquisitor', 'inquisitor'), npc('tmp:4', 'Odd Acolyte', 'darkAcolyte')]);
    expect(byName(s, 'Imperial Lord').role).toBe('sithLord');
    expect(byName(s, 'Korriban Acolyte').role).toBe('sithAcolyte');
    expect(byName(s, 'Odd Inquisitor')).toMatchObject({ role: 'darkJedi', rankRole: 'inquisitor' });
    expect(byName(s, 'Odd Acolyte')).toMatchObject({ role: 'darkJedi', rankRole: 'darkAcolyte' });
  });
});
