// Piecewise-linear helpers (progression-numbers: "interpolate linearly between anchors, flat
// outside"; Golden Rule 7 prefers smooth curves over step tables). Pure.

export type Anchors = readonly (readonly [number, number])[];

/** Linear between anchors, flat outside. Anchors are sorted by x. */
export function interp(anchors: Anchors, x: number): number {
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (!first || !last) throw new Error('interp: no anchors');
  if (x <= first[0]) return first[1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i]!;
    if (x <= x1) {
      const [x0, y0] = anchors[i - 1]!;
      return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return last[1];
}

/** Exact integral of a piecewise-linear function from a to b (trapezoids on the breakpoints). */
export function integratePiecewise(anchors: Anchors, a: number, b: number): number {
  if (b <= a) return 0;
  const pts = [a, ...anchors.map(([x]) => x).filter((x) => x > a && x < b), b];
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const x0 = pts[i - 1]!;
    const x1 = pts[i]!;
    s += ((interp(anchors, x0) + interp(anchors, x1)) / 2) * (x1 - x0);
  }
  return s;
}

export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
