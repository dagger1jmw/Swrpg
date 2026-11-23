// D-440: the Nov 22 lore update's date-driven data (Malachor V, Tython, Dromund Kaas, Korriban, Ossus, the healing fluid).
import { describe, expect, it } from 'vitest';
import { eraRulesAt } from '../../src/data/eraRules';
import { forceBonusAt, forceRichWorldAt } from '../../src/data/forceNexus';
import { worldStateAt } from '../../src/data/galaxyMap';
import { BACTA_KNOWN_FROM_YEAR, BACTA_STANDARD_FROM_YEAR, KOLTO_SUPPLY_EVENTS, healingFluidAt } from '../../src/data/health.config';
import { controlAt, leadersAt } from '../../src/data/worldControl';

const F = { world: 1.1, site: 1.15 };
const rules = (bby: number, place: string): string[] => eraRulesAt(bby, [place], []).filter((r) => !r.always).map((r) => r.id);

describe('Malachor V (D-440)', () => {
  it('gives its dark nexus bonus through 3951 BBY and none after', () => {
    expect(forceBonusAt(['Malachor V'], -3965, 'dark', F)?.nexus.id).toBe('malachor-v');
    expect(forceBonusAt(['Malachor V'], -3955, 'dark', F)?.nexus.id).toBe('malachor-v'); // the wound years
    expect(forceBonusAt(['Malachor V'], -3951, 'dark', F)?.nexus.id).toBe('malachor-v');
    expect(forceBonusAt(['Malachor V'], -3950, 'dark', F)).toBeNull();
    expect(forceRichWorldAt(['Malachor V'], -3661)).toBeNull();
  });

  it('shows on the map as a wreckage field in the Malachor system from 3951 BBY', () => {
    expect(worldStateAt('Malachor V', 3952)).toBeNull();
    expect(worldStateAt('Malachor V', 3951)).toMatchObject({ kind: 'asteroid and wreckage field', system: 'Malachor system' });
    expect(worldStateAt('Malachor V', 3661)).not.toBeNull();
    expect(worldStateAt('Malachor III', 3661)).toBeNull();
  });

  it('tells the narrator: a hazard, no nexus; surveyed and excavated by 3640', () => {
    expect(rules(3952, 'Malachor V')).not.toContain('malachor-v-wreckage');
    expect(rules(3661, 'Malachor V')).toContain('malachor-v-wreckage');
    expect(rules(3661, 'Malachor V')).not.toContain('malachor-v-surveyed');
    expect(rules(3640, 'Malachor V')).toEqual(expect.arrayContaining(['malachor-v-wreckage', 'malachor-v-surveyed']));
  });
});

describe('Tython, Dromund Kaas, Korriban, Ossus (D-440)', () => {
  it('Tython: no ordinary settlement; Kalikori an illegal settlement from the rediscovery', () => {
    expect(rules(3661, 'Tython')).toEqual(['tython-no-settlement']);
    expect(rules(3643, 'Tython')).toEqual(expect.arrayContaining(['tython-no-settlement', 'tython-kalikori']));
  });

  it('Dromund Kaas c. 3636-3631: the Sith Empire under Empress Acina, a blockaded vassal of Zakuul, not occupied', () => {
    const c = controlAt(['Dromund Kaas'], 3633);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ side: 'sithEmpire' });
    expect(c[0]!.note).toMatch(/Acina.*vassal of Zakuul.*blockaded.*not occupied/);
    expect(controlAt(['Kaas City'], 3630)).toEqual([]);
    expect(leadersAt(3633).find((l) => l.office === 'Sith Emperor')?.holder).toMatch(/^Empress Acina/);
  });

  it('Korriban: the Zakuul bombardment from c. 3636', () => {
    expect(rules(3637, 'Korriban')).not.toContain('korriban-zakuul-bombardment');
    expect(rules(3636, 'Korriban')).toContain('korriban-zakuul-bombardment');
  });

  it('Ossus: a ruin from 3996; the colony after 3636; the invasion of 3628', () => {
    expect(rules(3997, 'Ossus')).toEqual([]);
    expect(rules(3661, 'Ossus')).toEqual(['ossus-ruin']);
    expect(rules(3628, 'Ossus')).toEqual(['ossus-ruin', 'ossus-colony']);
    expect(rules(3627, 'Ossus')).toEqual([]);
  });
});

describe('the healing fluid by date (D-440)', () => {
  it('kolto is standard, bacta unknown before c. 4100 BBY and a rare import after, until the (pending) switch-over', () => {
    expect(healingFluidAt(BACTA_KNOWN_FROM_YEAR - 1)).toEqual({ standard: 'kolto', bacta: 'unknown', kolto: 'standard' });
    expect(healingFluidAt(-3661)).toEqual({ standard: 'kolto', bacta: 'rare import', kolto: 'standard' });
    expect(healingFluidAt(BACTA_STANDARD_FROM_YEAR)).toEqual({ standard: 'bacta', bacta: 'standard', kolto: 'cheaper alternative' });
    expect(healingFluidAt(0).standard).toBe('bacta');
  });

  it('records the 3625 Manaan invasion as a kolto supply event, and Manaan contested that year', () => {
    expect(KOLTO_SUPPLY_EVENTS.map((e) => e.year)).toEqual([-3625]);
    expect(controlAt(['Manaan'], 3625)[0]?.side).toBe('contested');
  });
});

describe('Ilum (D-443)', () => {
  it('opens to the Empire from c. 3651 BBY, the gate only', async () => {
    const { closedWorlds } = await import('../../src/data/galaxyMap');
    expect(closedWorlds('sithEmpire', 3652).map((g) => g.place)).toContain('Ilum');
    expect(closedWorlds('sithEmpire', 3651).map((g) => g.place)).not.toContain('Ilum');
    expect(controlAt(['Ilum'], 3645)).toEqual([]); // no inferred Cold War control span (D-411 [5]); the gate carries the ruling
    expect(controlAt(['Ilum'], 3640)[0]?.side).toBe('contested');
  });
});
