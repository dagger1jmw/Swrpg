// Report probe (D-457, D-459): the XP the per-hour 4.0x clamp discards, per profile and skill, over each calibration life
// (gated seed, the spread's years), with the counter fixed in D-458.
import { it } from 'vitest';
import { SPREAD_PROFILES } from '../spread/spread';
import { gated } from '../lifetime/profiles';
import { runLifetime } from '../support/lifetime';

for (const p of SPREAD_PROFILES)
  it(`discards ${p.name}`, () => {
    const t0 = Date.now();
    const r = runLifetime(gated(p.profile), p.years, p.opts);
    const by = Object.entries(r.discardedBySkill).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v.toFixed(1)}`);
    console.info(`[discards] ${p.name}: total ${r.discarded.toFixed(1)} XP over ${p.years} y${by.length ? `: ${by.join(', ')}` : ''} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }, 3_600_000);
