// Terrain accidents (Jared, D-144: "a hazard roll per bout from the terrain tags", in every sparring mode and in real
// fights; built with the ice tag, D-184). At the start of each bout (a real fight is one bout) every fighter still in
// it rolls each hazardous tag: below the tag's chance it takes the hazard by the health rules (hazardDamage: a fall
// lands by the fall location weights). Pure.
import { PART_TEXT } from './duel';
import { FALL_LOCATION_WEIGHTS, LOCATION_WEIGHTS, type HazardType } from '../data/health.config';
import { applyDamage, hazardDamage, rollLocation, severityOf } from './damage';
import type { DuelState, Fighter } from './duel';
import { nextFloat, type RngState } from './rng';
import { isDying, isIncapacitated, killsWhileDying, takesMinionOut, type Wound } from './wounds';

/** The top of the minor band (W 1-9, health §5). */
const MINOR_MAX_W = 9;

export interface TerrainHazard {
  chance: number;
  severity: 1 | 2 | 3;
  type: HazardType;
  /** The tag's label, for the note. */
  label: string;
  /** What happens, for the narration (default: a fall or a catch on the label). */
  note?: string | undefined;
  /** The wound stays in the minor band (flat floor: a turned ankle, D-185). */
  minorOnly?: boolean | undefined;
}

function hurtBy(f: Fighter, h: TerrainHazard, rng: RngState, day: number, prefix = 'terrain'): { f: Fighter; rng: RngState; note: string } {
  const { D, bypass } = hazardDamage(h.type, h.severity);
  const [part, r] = rollLocation(rng, h.type === 'fall' ? FALL_LOCATION_WEIGHTS : LOCATION_WEIGHTS);
  const raw = applyDamage(f.vitality, D, bypass);
  const dmg = h.minorOnly ? { ...raw, W: Math.min(MINOR_MAX_W, Math.max(1, raw.W)) } : raw;
  const sev = severityOf(dmg.W);
  let out: Fighter = { ...f, vitality: dmg.vitality, out: f.out || (f.minion && dmg.vitality <= 0) };
  if (sev) {
    const w: Wound = { id: `${f.id}:w${f.wounds.length + 1}`, part, severity: sev, W: dmg.W, stabilized: false, healProgress: 0, day, source: `${prefix}: ${h.label}` };
    out = { ...out, wounds: [...f.wounds, w], dead: f.dead || killsWhileDying(f.wounds, w), out: out.out || (f.minion && takesMinionOut(sev)) };
  }
  if (isDying(out.wounds) || isIncapacitated(out.wounds)) out = { ...out, out: true };
  const what = prefix === 'hazard' ? `is caught by the ${h.type} (${h.label})` : h.note ? `${h.note} on the ${h.label}` : `${h.type === 'fall' ? 'falls' : 'is caught'} on the ${h.label}`;
  return { f: out, rng: r, note: `${prefix}: ${f.name} ${what}${sev ? ` (${sev} ${PART_TEXT[part] ?? part})` : ' (only stamina lost)'}` };
}

/**
 * A narrator's hazard that ends a fight (Jared, D-217; an environmentCollapse interruption, D-196): every fighter still
 * in it takes the hazard by the normal hazard rules (hazardDamage at the hint's severity, a rolled location). The
 * narrator names the hazard and its severity band; the engine rolls the damage. The duel's RNG advances.
 */
export function hazardOnAll(d: DuelState, hazard: { type: HazardType; severity: 1 | 2 | 3; cause: string }, day: number): { duel: DuelState; notes: string[] } {
  let rng = d.rng;
  const notes: string[] = [];
  const h: TerrainHazard = { chance: 1, severity: hazard.severity, type: hazard.type, label: hazard.cause };
  const hit = (f: Fighter): Fighter => {
    if (f.out || f.dead) return f;
    const x = hurtBy(f, h, rng, day, 'hazard');
    rng = x.rng;
    notes.push(x.note);
    return x.f;
  };
  const a = hit(d.a);
  const opponents = d.opponents.map(hit);
  return { duel: { ...d, a, opponents, rng }, notes };
}

/**
 * The bout-start (or block-start) hazard roll; the duel's RNG advances. Every fighter still in rolls each tag as
 * before, but the whole fight takes at most one accident per roll (Jared, D-228; pass 1 number 8, pass 2 balance row
 * 19: one fighter fell three times in a fight): when several fighters roll under a chance, one of them is picked at
 * random, so the player is not favoured by rolling first. The note names the accident.
 */
export function rollBoutHazards(d: DuelState, hazards: readonly TerrainHazard[], day: number): { duel: DuelState; notes: string[] } {
  if (!hazards.length) return { duel: d, notes: [] };
  // Counted for the tests and the log: one roll of the terrain per bout or per block of exchanges (D-185).
  d = { ...d, hazardRolls: (d.hazardRolls ?? 0) + 1, lastHazardAt: d.exchange };
  let rng = d.rng;
  const fighters = [d.a, ...d.opponents];
  const hits: { at: number; h: TerrainHazard }[] = [];
  fighters.forEach((f, at) => {
    if (f.out || f.dead) return;
    for (const h of hazards) {
      const [u, r] = nextFloat(rng);
      rng = r;
      if (u < h.chance) {
        hits.push({ at, h });
        break;
      }
    }
  });
  if (!hits.length) return { duel: { ...d, rng }, notes: [] };
  let pick = hits[0]!;
  if (hits.length > 1) {
    const [u, r] = nextFloat(rng);
    rng = r;
    pick = hits[Math.min(hits.length - 1, Math.floor(u * hits.length))]!;
  }
  const x = hurtBy(fighters[pick.at]!, pick.h, rng, day);
  const next = fighters.map((f, i) => (i === pick.at ? x.f : f));
  return { duel: { ...d, a: next[0]!, opponents: next.slice(1), rng: x.rng }, notes: [x.note] };
}
