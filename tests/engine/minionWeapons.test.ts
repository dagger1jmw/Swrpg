// Minion weapon-skill profiles (D-195): every kind's main weapon has a trained level at every grade.
import { describe, expect, it } from 'vitest';
import { MINION_KINDS, MINION_WEAPON_PROFILE } from '../../src/data/npcGen.config';
import { FORM_IDS } from '../../src/data/skills';
import { weaponSkillKind } from '../../src/data/weapons';
import { minionInputs, minionWeaponLevel } from '../../src/engine/npcGen';
import { npcLevelsFor } from '../../src/features/npcs/selectors';

/** The level a minion of this kind and grade fights with (as buildMinionFighter computes it). */
function fightingLevel(kindId: string, grade: number): number {
  const kind = MINION_KINDS.find((k) => k.id === kindId)!;
  const inp = minionInputs(kindId, grade, `t:${kindId}:${grade}`);
  const base = npcLevelsFor(inp, 'human', inp.age, 1_300_000);
  const w = minionWeaponLevel(kindId, grade);
  const lv = w ? { ...base, [w.skill]: Math.max(base[w.skill] ?? 0, w.level) } : base;
  const sk = weaponSkillKind(kind.weapon);
  if (sk === 'form') return Math.max(...FORM_IDS.map((f) => lv[f] ?? 0));
  return sk === 'unarmed' ? (lv['agility'] ?? 0) : (lv[sk] ?? 0);
}

describe('minion weapon-skill profiles (D-195)', () => {
  it('every kind has a profile, and an explicit one trains the kind’s own weapon skill', () => {
    for (const k of MINION_KINDS) {
      const p = MINION_WEAPON_PROFILE[k.id];
      expect(p, k.id).toBeDefined();
      if (p!.source === 'kind') expect(p!.skill, k.id).toBe(weaponSkillKind(k.weapon));
    }
  });
  it('every kind’s main weapon has a trained level at every grade, rising with the grade', () => {
    for (const k of MINION_KINDS) {
      let prev = 0;
      for (let g = 1; g <= 5; g++) {
        const lv = fightingLevel(k.id, g);
        expect(lv, `${k.id} grade ${g}`).toBeGreaterThan(3);
        expect(lv, `${k.id} grade ${g}`).toBeGreaterThanOrEqual(prev);
        prev = lv;
      }
    }
  });
  it('a grade-1 militia fighter is a poor shot, well below a grade-1 trooper', () => {
    const militia = fightingLevel('militia', 1);
    expect(militia).toBeGreaterThan(3);
    expect(militia).toBeLessThan(fightingLevel('trooper', 1) * 0.6);
  });
});
