// Lost limbs per lifetime (Jared, D-256 measurement; report only): each lifetime profile on the spread's 20 seeds, the
// severed limbs it ends its life with (every sever is a lasting injury at once), with morale off or on. Run with
// npm run severs; each seed prints one "[severs] {json}" line. Not part of npm test or test:all.
import { MORALE } from '../../src/data/combat.config';
import { LOCATION_WEIGHTS, SEVERING } from '../../src/data/health.config';
import { runLifetime, type LifeProfile } from '../support/lifetime';
import { SPREAD_SEEDS } from '../spread/spread';

const LOST = ['lostHand', 'lostArm', 'lostLeg'];

export function runSevers(name: string, profile: LifeProfile, years: number, morale: boolean, opts: Parameters<typeof runLifetime>[2] = {}, severAt?: number): number[] {
  (MORALE as { enabled: boolean }).enabled = morale;
  // A candidate severing threshold, measured only (Jared: proposed, not adopted).
  if (severAt !== undefined) (SEVERING as { at: number }).at = severAt;
  // A candidate limb-hit share (the limbs' location weights x this, the rest to the torso); measured only.
  if (opts && 'limbShare' in (opts as object)) {
    const share = (opts as { limbShare: number }).limbShare;
    const w = LOCATION_WEIGHTS as Record<string, number>;
    let moved = 0;
    for (const k of ['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'leftHand', 'rightHand']) {
      moved += w[k]! * (1 - share);
      w[k] = w[k]! * share;
    }
    w['torso'] = w['torso']! + moved;
    delete (opts as { limbShare?: number }).limbShare;
  }
  const counts: number[] = [];
  for (let k = 0; k < SPREAD_SEEDS; k++) {
    const seed = k === 0 ? profile.seed : `${profile.seed}-s${k}`;
    let r: ReturnType<typeof runLifetime>;
    try {
      r = runLifetime({ ...profile, seed }, years, opts);
    } catch (e) {
      // The harness stops on a death; a candidate that kills is counted, not hidden.
      console.info(`[severs] ${JSON.stringify({ profile: name, morale, severAt: SEVERING.at, torso: LOCATION_WEIGHTS.torso, seed, died: String(e instanceof Error ? e.message : e) })}`);
      counts.push(-1);
      continue;
    }
    const born = r.state.character.birthDay;
    const lost = r.state.health.lasting.filter((l) => LOST.includes(l.kind)).map((l) => ({ part: l.part, age: Math.round(((l.day - born) / 368) * 10) / 10 }));
    counts.push(lost.length);
    console.info(`[severs] ${JSON.stringify({ profile: name, morale, severAt: SEVERING.at, torso: LOCATION_WEIGHTS.torso, seed, count: lost.length, lost })}`);
  }
  const alive = counts.filter((c) => c >= 0);
  const sorted = [...alive].sort((a, b) => a - b);
  const mid = sorted.length % 2 ? sorted[(sorted.length - 1) / 2]! : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2;
  console.info(`[severs-summary] ${JSON.stringify({ profile: name, morale, severAt: SEVERING.at, torso: LOCATION_WEIGHTS.torso, deaths: counts.length - alive.length, mean: alive.reduce((a, b) => a + b, 0) / Math.max(1, alive.length), median: mid, min: sorted[0], max: sorted[sorted.length - 1], counts })}`);
  return counts;
}
