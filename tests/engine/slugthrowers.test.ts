// Slugthrowers (D-200; Legends): a saber blocks slugs but never redirects them; no vs-blaster matchup; rapid fire and
// scatter shot give a saber defender -1; Mandalorians may carry them by era.
import { describe, expect, it } from 'vitest';
import { WEAPON_BASE } from '../../src/data/health.config';
import { MANDALORIAN_SLUGTHROWERS, RANGED_WEAPONS, SLUGTHROWERS, mandalorianSlugthrower, slugthrowerShareAt, weaponSkillKind } from '../../src/data/weapons';
import { matchupFor, resolveExchange, startDuel, type Fighter } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { forceUser, REAL } from '../support/duelSim';

const shooter = (weapon: Fighter['weapon']): Fighter => forceUser('S', 20, { skillId: 'blaster', form: null, weapon, forceSense: 0, minion: true });
const jedi = (form: string): Fighter => forceUser('J', 70, { form, skillId: form });

describe('slugthrowers (D-200)', () => {
  it('are ranged, non-saber weapons fired with the blaster skill', () => {
    for (const w of SLUGTHROWERS) {
      expect(RANGED_WEAPONS).toContain(w);
      expect(weaponSkillKind(w)).toBe('blaster');
      expect(WEAPON_BASE[w]).toBeGreaterThan(0);
    }
  });
  it('give no vs-blaster form matchup; blasters still do', () => {
    expect(matchupFor(jedi('soresu'), shooter('blasterRifle'), REAL, 1).some((m) => /vsBlasters/.test(m.source))).toBe(true);
    for (const w of SLUGTHROWERS) expect(matchupFor(jedi('soresu'), shooter(w), REAL, 1).some((m) => /vsBlasters/.test(m.source)), w).toBe(false);
  });
  it('are never redirected: a Soresu or Shien defender sends blaster bolts back, never slugs', () => {
    const redirects = (weapon: Fighter['weapon'], form: string): number => {
      let n = 0;
      for (let i = 0; i < 1500; i++) {
        const s = resolveExchange({ ...startDuel(jedi(form), [shooter(weapon)], seedRng(`r${weapon}${i}`)), advantage: -3 }, REAL, 0);
        if (s.log[0]!.hit?.redirected) n++;
      }
      return n;
    };
    expect(redirects('blasterRifle', 'soresu')).toBeGreaterThan(0);
    for (const w of SLUGTHROWERS) for (const form of ['soresu', 'shien']) expect(redirects(w, form), `${w} ${form}`).toBe(0);
  });
  it('rapid fire and scatter shot give a saber defender -1; a slug pistol does not', () => {
    const defenseMods = (weapon: Fighter['weapon']): string[] => {
      const s = resolveExchange({ ...startDuel(jedi('soresu'), [shooter(weapon)], seedRng('m')), advantage: -3 }, REAL, 0);
      return s.log[0]!.rollA!.modifiers.filter((m) => m.value === -1).map((m) => m.source);
    };
    expect(defenseMods('slugRifle')).toContain('rapid slugthrower fire');
    expect(defenseMods('scatterGun')).toContain('scatter shot');
    expect(defenseMods('slugPistol')).toEqual([]);
    expect(defenseMods('blasterRifle')).toEqual([]);
  });
  it('Mandalorians carry them by the era share', () => {
    expect(slugthrowerShareAt(-3661)).toBe(0.15);
    expect(slugthrowerShareAt(-22)).toBe(0.2);
    expect(slugthrowerShareAt(10)).toBe(0.25);
    expect(MANDALORIAN_SLUGTHROWERS.every((e) => e.share > 0 && e.share < 0.5)).toBe(true);
    expect(mandalorianSlugthrower(-22, 0.5, 0)).toBeNull();
    expect(mandalorianSlugthrower(-22, 0.1, 0.1)).toBe('slugPistol');
    expect(mandalorianSlugthrower(-22, 0.1, 0.7)).toBe('slugRifle');
    expect(mandalorianSlugthrower(-22, 0.1, 0.95)).toBe('scatterGun');
  });
});
