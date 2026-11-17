import { describe, expect, it } from 'vitest';
import { newId, uuidV4FromBytes, type CryptoLike } from '../../src/ui/ids';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId (D-101: no secure context on the LAN)', () => {
  it('uses crypto.randomUUID when it exists', () => {
    const c: CryptoLike = {
      randomUUID: () => 'from-random-uuid',
      getRandomValues: () => {
        throw new Error('not used');
      },
    };
    expect(newId(c)).toBe('from-random-uuid');
  });

  it('falls back to getRandomValues when randomUUID is missing (http:// pages)', () => {
    let seed = 7;
    const c: CryptoLike = {
      getRandomValues: <T extends ArrayBufferView>(a: T): T => {
        const bytes = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
        for (let i = 0; i < bytes.length; i++) bytes[i] = seed = (seed * 131 + 17) & 0xff;
        return a;
      },
    };
    const a = newId(c);
    const b = newId(c);
    expect(a).toMatch(V4);
    expect(b).toMatch(V4);
    expect(a).not.toBe(b);
  });

  it('sets the version and variant bits on any bytes', () => {
    expect(uuidV4FromBytes(new Uint8Array(16).fill(0xff))).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(uuidV4FromBytes(new Uint8Array(16))).toBe('00000000-0000-4000-8000-000000000000');
    expect(() => uuidV4FromBytes(new Uint8Array(8))).toThrow(RangeError);
  });

  it('works with the real Web Crypto of this runtime, with and without randomUUID', () => {
    const real = globalThis.crypto;
    expect(newId(real)).toMatch(V4);
    expect(newId({ getRandomValues: real.getRandomValues.bind(real) })).toMatch(V4);
  });
});
