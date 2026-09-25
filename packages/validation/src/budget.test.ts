import { describe, expect, it } from 'vitest';
import { budgetMonthPatchSchema } from './budget';

describe('monthly cash position contract', () => {
  it('accepts a whole-taka cash-in-pocket update', () => {
    expect(
      budgetMonthPatchSchema.parse({ cashInPocket: 3_000, monthVersion: 2 }),
    ).toEqual({ cashInPocket: 3_000, monthVersion: 2 });
  });

  it('rejects empty, negative, and fractional cash updates', () => {
    for (const cashInPocket of [undefined, -1, 1.5]) {
      expect(
        budgetMonthPatchSchema.safeParse({ cashInPocket, monthVersion: 2 })
          .success,
      ).toBe(false);
    }
  });
});
