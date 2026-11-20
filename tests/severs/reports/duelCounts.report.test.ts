// Report only (D-256): why the lifetime profiles lose so many limbs. (1) The fights each profile's schedule makes over
// its life, by kind. (2) The chance a duel takes one of the player's limbs, at the gaps the schedules use, now and under
// the severing candidates. Lifetime severs are about (1) x (2) until the limbs run out (four limbs, two hands).
import { it } from 'vitest';
import { LOCATION_WEIGHTS, SEVERING } from '../../../src/data/health.config';
import { runUntilBeat, startDuel } from '../../../src/engine/duel';
import { seedRng } from '../../../src/engine/rng';
import { REAL, forceUser } from '../../support/duelSim';
import { ANAKIN, AVERAGE, LUKE, OBIWAN } from '../../lifetime/profiles';
import type { LifeProfile } from '../../support/lifetime';

const YEARS: Record<string, number> = { average: 95, anakin: 70, obiwan: 70, luke: 70 };

function schedule(name: string, p: LifeProfile): Record<string, number> {
  const out: Record<string, number> = {};
  for (let day = 0; day < YEARS[name]! * 368; day++) {
    const age = p.startAge + day / 368;
    for (const f of p.fights?.(age, day) ?? []) {
      const key = `${f.stakes}${f.stakes === 'spar' ? `:${f.sparringMode ?? 'rank default'}` : ''}:${f.opponent && f.opponent !== 'duelist' ? 'minions' : 'duelist'}`;
      out[key] = (out[key] ?? 0) + 1;
    }
  }
  return out;
}

const base = { ...LOCATION_WEIGHTS };
function setLimbShare(share: number): void {
  const w = LOCATION_WEIGHTS as Record<string, number>;
  let moved = 0;
  for (const k of ['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'leftHand', 'rightHand']) {
    w[k] = base[k as keyof typeof base] * share;
    moved += base[k as keyof typeof base] * (1 - share);
  }
  w['torso'] = base.torso + moved;
}

it('fight schedules and the per-duel chance of losing a limb', () => {
  for (const [name, p] of [['average', AVERAGE], ['anakin', ANAKIN], ['obiwan', OBIWAN], ['luke', LUKE]] as const) console.info(`[duel-counts] ${name}: ${JSON.stringify(schedule(name, p))}`);
  for (const [label, at, share] of [['now (35)', 35, 1], ['A: at 50', 50, 1], ['B: at 50, limb share x0.5', 50, 0.5], ['C: at 50, limb share x0.25', 50, 0.25]] as const) {
    (SEVERING as { at: number }).at = at;
    setLimbShare(share);
    const rows: string[] = [];
    for (const gap of [-20, -10, 0, 10]) {
      let lost = 0;
      let rng = seedRng(`limb${gap}`);
      for (let i = 0; i < 4000; i++) {
        const d = runUntilBeat(startDuel(forceUser('A', 60), [forceUser('B', 60 + gap)], rng), REAL, 0, 'toEnd', 3000).state;
        rng = d.rng;
        if (d.a.wounds.some((w) => w.severed)) lost++;
      }
      rows.push(`gap ${gap}: ${((lost / 4000) * 100).toFixed(1)}%`);
    }
    console.info(`[limb-per-duel] ${label}: ${rows.join(', ')}`);
  }
  (SEVERING as { at: number }).at = 35;
  setLimbShare(1);
}, 0);
