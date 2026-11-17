import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('scaffold', () => {
  it('has Zod v4 with built-in JSON Schema export', () => {
    const schema = z.object({ a: z.string() });
    expect(z.toJSONSchema(schema)).toMatchObject({ type: 'object', required: ['a'] });
  });
});
