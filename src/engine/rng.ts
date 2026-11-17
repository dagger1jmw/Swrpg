// Seeded, serializable RNG (sfc32). The state lives in GameState.meta.rngState (architecture §2).
// Pure: every function takes a state and returns the value with the next state.

export type RngState = readonly [number, number, number, number];

/** cyrb128 string hash -> four 32-bit words. */
function hash128(text: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** One sfc32 step: returns a uint32 and the next state. */
export function nextU32(state: RngState): [number, RngState] {
  let [a, b, c, d] = state;
  const t = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) | 0;
  return [t >>> 0, [a >>> 0, b >>> 0, c >>> 0, d >>> 0]];
}

/** Seeds from a string and discards the first outputs (sfc32 warm-up). */
export function seedRng(seed: string): RngState {
  let state: RngState = hash128(seed);
  for (let i = 0; i < 15; i++) state = nextU32(state)[1];
  return state;
}

/** Uniform float in [0, 1). */
export function nextFloat(state: RngState): [number, RngState] {
  const [u, next] = nextU32(state);
  return [u / 4294967296, next];
}

/** Uniform integer in [min, max], both inclusive. */
export function nextInt(state: RngState, min: number, max: number): [number, RngState] {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RangeError(`nextInt: bad range ${min}..${max}`);
  }
  const [f, next] = nextFloat(state);
  return [min + Math.floor(f * (max - min + 1)), next];
}

export function rollD20(state: RngState): [number, RngState] {
  return nextInt(state, 1, 20);
}

/**
 * Convenience cursor for code that draws several numbers in sequence. It copies the state in and
 * hands the final state back through `state()`, so callers stay pure.
 */
export interface RngCursor {
  d20(): number;
  int(min: number, max: number): number;
  float(): number;
  state(): RngState;
}

export function rngCursor(initial: RngState): RngCursor {
  let s: RngState = initial;
  const take = <T>(r: [T, RngState]): T => {
    s = r[1];
    return r[0];
  };
  return {
    d20: () => take(rollD20(s)),
    int: (min, max) => take(nextInt(s, min, max)),
    float: () => take(nextFloat(s)),
    state: () => s,
  };
}
