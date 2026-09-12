import { describe, expect, it } from 'vitest';
import { healthSchema } from './index';
describe('health schema', () => {
  it('accepts healthy responses', () => {
    expect(healthSchema.parse({ data: { status: 'ok' } })).toEqual({
      data: { status: 'ok' },
    });
  });
});
