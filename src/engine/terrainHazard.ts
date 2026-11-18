// Terrain accidents (Jared, D-144: "a hazard roll per bout from the terrain tags", in every sparring mode and in real
// fights; built with the ice tag, D-184). At the start of each bout (a real fight is one bout) every fighter still in
// it rolls each hazardous tag: below the tag's chance it takes the hazard by the health rules (hazardDamage: a fall
// lands by the fall location weights). Pure.
import { FALL_LOCATION_WEIGHTS, LOCATION_WEIGHTS, type HazardType } from '../data/health.config';
import { applyDamage, hazardDamage, rollLocation, severityOf } from './damage';
import type { DuelState, Fighter } from './duel';
import { nextFloat, type RngState } from './rng';
import { isDying, isIncapacitated, killsWhileDying, takesMinionOut, type Wound } from './wounds';

export interface TerrainHazard {
  chance: number;
  severity: 1 | 2 | 3;
  type: HazardType;
  /** The tag's label, for the note. */
  label: string;
}

function hurtBy(f: Fighter, h: TerrainHazard, rng: RngState, day: number): { f: Fighter; rng: RngState; note: string } {
  const { D, bypass } = hazardDamage(h.type, h.severity);
  const [part, r] = rollLocation(rng, h.type === 'fall' ? FALL_LOCATION_WEIGHTS : LOCATION_WEIGHTS);
  const dmg = applyDamage(f.vitality, D, bypass);
  const sev = severityOf(dmg.W);
  let out: Fighter = { ...f, vitality: dmg.vitality, out: f.out || (f.minion && dmg.vitality <= 0) };
  if (sev) {
    const w: Wound = { id: `${f.id}:w${f.wounds.length + 1}`, part, severity: sev, W: dmg.W, stabilized: false, healProgress: 0, day, source: `terrain: ${h.label}` };
    out = { ...out, wounds: [...f.wounds, w], dead: f.dead || killsWhileDying(f.wounds, w), out: out.out || (f.minion && takesMinionOut(sev)) };
  }
  if (isDying(out.wounds) || isIncapacitated(out.wounds)) out = { ...out, out: true };
  return { f: out, rng: r, note: `terrain: ${f.name} ${h.type === 'fall' ? 'falls' : 'is caught'} on the ${h.label}${sev ? ` (${sev} ${part})` : ' (only stamina lost)'}` };
}

/** The bout-start hazard rolls; the duel's RNG advances. Notes name each accident. */
export function rollBoutHazards(d: DuelState, hazards: readonly TerrainHazard[], day: number): { duel: DuelState; notes: string[] } {
  if (!hazards.length) return { duel: d, notes: [] };
  let rng = d.rng;
  const notes: string[] = [];
  const roll = (f: Fighter): Fighter => {
    let cur = f;
    for (const h of hazards) {
      if (cur.out || cur.dead) break;
      const [u, r] = nextFloat(rng);
      rng = r;
      if (u >= h.chance) continue;
      const x = hurtBy(cur, h, rng, day);
      rng = x.rng;
      cur = x.f;
      notes.push(x.note);
    }
    return cur;
  };
  const a = roll(d.a);
  const opponents = d.opponents.map(roll);
  return { duel: { ...d, a, opponents, rng }, notes };
}
