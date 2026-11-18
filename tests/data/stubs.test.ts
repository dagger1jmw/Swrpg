import { describe, expect, it } from 'vitest';
import {
  STUB_ALIGNMENT_MULT,
  STUB_DARK_PRESSURE,
} from '../../src/data/stubs';

// architecture §15: each stub's value holds until the named milestone replaces it.
describe('stubs (D-56, D-70)', () => {
  // Rust, e(f) and skill levels were replaced in M3, wound penalty and Spent in M5, by progression and health selectors.
  it('alignment multiplier 1.0 and dark pressure 0 until M6', () => {
    expect(STUB_ALIGNMENT_MULT).toBe(1);
    expect(STUB_DARK_PRESSURE).toBe(0);
  });
});
