// Restricted forms (lore batch 10, D-370): Vaapad's teacher-or-records gate replaces the maceLiving flags, and forms
// of Jedi origin stay open to Sith (ruling 15).
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { JEDI_ORIGIN_ALSO_SITH, VAAPAD_CREATED_YEAR, vaapadAccess } from '../../src/features/progression/formAccess';
import { resolveTraining } from '../../src/features/progression/selectors';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const at = (year: number, path: 'jedi' | 'sith', xp: Record<string, number>): GameState => {
  const day = absDayFromDate({ year, month: 1, day: 1 });
  return createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: `forms-${path}-${year}`,
    start: { day, second: 8 * 3600 },
    character: path === 'jedi'
      ? { name: 'Kael', birthDay: day - 40 * 368, path, archetype: 'jediGuardian', mainFormId: 'juyo', trainingStartAge: 4 }
      : { name: 'Vex', birthDay: day - 30 * 368, path, archetype: 'sithWarrior', mainFormId: 'juyo', trainingStartAge: 8 },
    startingXp: xp,
    rank: path === 'jedi' ? 'knight' : 'lord',
  });
};

describe('Vaapad: a teacher or records (D-370)', () => {
  const base = { teacher: null, records: false, lightSide: true, juyoLevel: 70 };

  it('is learnable in the New Jedi Order era from the recovered records, with Windu long dead and no teacher', () => {
    expect(vaapadAccess({ ...base, year: 12, records: true })).toEqual({ ok: true, via: 'records', corruptionRisk: false });
    // Through the training pipeline: a Jedi Knight in 12 ABY with Juyo 65 starts Vaapad from the Form VII records.
    const s = at(12, 'jedi', { juyo: xpForLevel(65), shiiCho: xpForLevel(50) });
    const plan = resolveTraining(s, { activityId: 'juyoVaapadBasics', skillId: 'vaapad', hours: 1, source: { kind: 'record', id: 'record:njoFormVII' } });
    expect(plan.ok, plan.ok ? '' : plan.reason).toBe(true);
  });

  it('is not learnable before Windu and Bulq create it, even from a master or with records', () => {
    for (const year of [-3661, -1000, VAAPAD_CREATED_YEAR - 1]) {
      expect(vaapadAccess({ ...base, year, teacher: { kind: 'master' }, records: true }).ok).toBe(false);
    }
    // The records don't exist then either.
    const s = at(-1000, 'jedi', { juyo: xpForLevel(65) });
    const plan = resolveTraining(s, { activityId: 'juyoVaapadBasics', skillId: 'vaapad', hours: 1, source: { kind: 'record', id: 'record:njoFormVII' } });
    expect(plan.ok).toBe(false);
  });

  it('in the Clone Wars needs Windu with his permission, Bulq (with a corruption risk) or a Vaapad master; no records yet', () => {
    expect(vaapadAccess({ ...base, year: -22, records: true }).ok).toBe(false);
    expect(vaapadAccess({ ...base, year: -22, teacher: { kind: 'windu', permission: false } }).ok).toBe(false);
    expect(vaapadAccess({ ...base, year: -22, teacher: { kind: 'windu', permission: true } })).toEqual({ ok: true, via: 'teacher', corruptionRisk: false });
    expect(vaapadAccess({ ...base, year: -22, teacher: { kind: 'bulq' } })).toEqual({ ok: true, via: 'teacher', corruptionRisk: true });
    expect(vaapadAccess({ ...base, year: -22, teacher: { kind: 'master' } }).ok).toBe(true);
  });

  it('keeps the design gates: light side only, Juyo 61+', () => {
    expect(vaapadAccess({ ...base, year: 12, records: true, lightSide: false }).ok).toBe(false);
    expect(vaapadAccess({ ...base, year: 12, records: true, juyoLevel: 60 }).ok).toBe(false);
  });

  it('the Sith archives no longer hold Vaapad; Juyo keeps its known-only drill', () => {
    const sith = at(-3661, 'sith', { juyo: xpForLevel(70) });
    expect(resolveTraining(sith, { activityId: 'juyoVaapadBasics', skillId: 'vaapad', hours: 1, source: { kind: 'record', id: 'record:sithArchiveForms' } }).ok).toBe(false);
    expect(resolveTraining(sith, { activityId: 'juyoVaapadBasics', skillId: 'juyo', hours: 1 }).ok).toBe(true);
  });
});

describe('forms of Jedi origin stay open to Sith (ruling 15)', () => {
  it('a Sith character can learn Soresu, Ataru, Niman and Sokan', () => {
    const s = at(-3661, 'sith', { juyo: xpForLevel(60) });
    const drill: Record<string, string> = { soresu: 'soresuBasics', ataru: 'ataruBasics', niman: 'nimanBasics', sokan: 'sokanBasics' };
    for (const form of JEDI_ORIGIN_ALSO_SITH) {
      const plan = resolveTraining(s, { activityId: drill[form]!, hours: 1, source: { kind: 'instructor' } });
      expect(plan.ok, `${form}: ${plan.ok ? '' : plan.reason}`).toBe(true);
      // And from the Sith archives, without a living teacher.
      const rec = resolveTraining(s, { activityId: drill[form]!, hours: 1, source: { kind: 'record', id: 'record:sithArchiveForms' } });
      expect(rec.ok, `${form} (Sith archives): ${rec.ok ? '' : rec.reason}`).toBe(true);
    }
  });
});
