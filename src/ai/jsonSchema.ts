// Zod -> Gemini response JSON Schema (architecture §3, D-68). z.toJSONSchema output is reduced to
// the keyword subset Gemini documents; constraints it strips anyway (minLength, maxLength,
// pattern...) are removed here and enforced by Zod after parsing.
import { z, type ZodType } from 'zod';

export const SUPPORTED_KEYWORDS = new Set([
  'type',
  'title',
  'description',
  'properties',
  'required',
  'additionalProperties',
  'enum',
  'format',
  'minimum',
  'maximum',
  'items',
  'prefixItems',
  'minItems',
  'maxItems',
  'anyOf',
  '$ref',
  '$defs',
]);

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function sanitize(node: Json): Json {
  if (Array.isArray(node)) return node.map(sanitize);
  if (node === null || typeof node !== 'object') return node;
  const out: { [k: string]: Json } = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'const') {
      out['enum'] = [value];
      continue;
    }
    if (key === 'oneOf') {
      out['anyOf'] = sanitize(value);
      continue;
    }
    if (!SUPPORTED_KEYWORDS.has(key)) continue;
    // additionalProperties: false is left out of the wire (m8-ground, D-520): Gemini emits only the properties listed, and Zod
    // still parses every reply and every event, stripping anything extra; it cost 29 characters an object (about 1,100 in the
    // largest narrative schema).
    if (key === 'additionalProperties' && value === false) continue;
    // Zod's safe-integer bounds are noise.
    if ((key === 'minimum' || key === 'maximum') && typeof value === 'number' && Math.abs(value) >= Number.MAX_SAFE_INTEGER) continue;
    // `items: false` after prefixItems (tuples) is not in the subset.
    if (key === 'items' && typeof value === 'boolean') continue;
    if (key === 'properties' && value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = Object.fromEntries(Object.entries(value).map(([p, v]) => [p, sanitize(v)]));
      continue;
    }
    out[key] = sanitize(value);
  }
  return out;
}

export function toGeminiSchema(schema: ZodType): Record<string, Json> {
  return sanitize(z.toJSONSchema(schema) as Json) as Record<string, Json>;
}

/** Every keyword used anywhere in a schema (property names excluded), for tests. */
export function keywordsUsed(node: Json, acc = new Set<string>()): Set<string> {
  if (Array.isArray(node)) node.forEach((n) => keywordsUsed(n, acc));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      acc.add(k);
      if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) Object.values(v).forEach((p) => keywordsUsed(p, acc));
      else keywordsUsed(v, acc);
    }
  }
  return acc;
}
