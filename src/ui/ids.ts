// Campaign and branch IDs (not game randomness; the game uses the seeded RNG in src/engine).
// crypto.randomUUID exists only in secure contexts (https or localhost), so over the LAN
// (http://192.168...) it is undefined. crypto.getRandomValues works on any page, so a v4 UUID
// is built from it when randomUUID is missing (D-101).

/** The part of the Web Crypto API this needs; injected for tests. */
export type CryptoLike = Pick<Crypto, 'getRandomValues'> & { randomUUID?: () => string };

/** RFC 4122 version 4 UUID from 16 random bytes. */
export function uuidV4FromBytes(bytes: Uint8Array): string {
  if (bytes.length !== 16) throw new RangeError('uuidV4FromBytes needs 16 bytes');
  const b = Uint8Array.from(bytes);
  b[6] = (b[6]! & 0x0f) | 0x40; // version 4
  b[8] = (b[8]! & 0x3f) | 0x80; // variant 10xx
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** A new UUID: crypto.randomUUID when available, otherwise one built from getRandomValues. */
export function newId(c: CryptoLike = globalThis.crypto): string {
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  return uuidV4FromBytes(c.getRandomValues(new Uint8Array(16)));
}
