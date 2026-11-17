// npc-generation test 2 on the real loop: the closed form (which models training only; combat enters NPCs
// through war years) matches the Average profile's training through the routine day loop within +/-2
// levels at 10, 30 and 60 years (highest form). The Average's one yearly skirmish is left out here, like
// in the calc the closed form is measured from (D-133).
import { beforeAll, describe, expect, it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { FORM_TRANSFER_SHARE, K } from '../../src/data/progression.config';
import { formXps } from '../../src/engine/closedForm';
import { levelExact } from '../../src/engine/curve';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { AVERAGE } from './profiles';

const PLAN = { soresu: 2, ataru: 1 };
const GUARDIAN = ARCHETYPE_BY_ID.get('jediGuardian')!;

let r: LifeResult;
beforeAll(() => {
  const { fights: _fights, ...training } = AVERAGE;
  r = runLifetime(training, 60);
}, 600_000);

describe('npc test 2: closed form vs the routine day loop', () => {
  it('within +/-2 levels at 10, 30 and 60 years (highest form)', () => {
    for (const years of [10, 30, 60]) {
      const xp = formXps({ formPaces: GUARDIAN.formPaces, k: K, startAge: 4, age: 4 + years, padawanAge: 12, knightAge: 20.5, onePhase: false, padawanPlan: PLAN, knightPlan: PLAN, mult: () => 1, transferShare: FORM_TRANSFER_SHARE });
      const closed = levelExact(Math.max(0, ...Object.values(xp)));
      const day = r.mainByYear[years - 1]!;
      expect(Math.abs(closed - day), `${years} years: day ${day.toFixed(2)} vs closed ${closed.toFixed(2)}`).toBeLessThanOrEqual(2);
    }
  });
});
