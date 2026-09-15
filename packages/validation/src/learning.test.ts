import { describe, it, expect } from 'vitest';
import {
  learningEpicSchema,
  learningTaskSchema,
  manualTimeSchema,
  sessionInputSchema,
  calendarDateSchema,
} from './learning';
describe('learning form contracts', () => {
  it('returns normalized values rather than unparsed form strings', () => {
    const result = learningTaskSchema.parse({
      name: ' Task ',
      description: ' Detail ',
      weight: '10',
      targetMinutes: '45',
      comment: null,
    });
    expect(result).toMatchObject({
      name: 'Task',
      description: 'Detail',
      weight: 10,
      targetMinutes: 45,
    });
  });
  it('requires epic time and rejects impossible calendar dates', () => {
    expect(
      learningEpicSchema.safeParse({ name: 'Epic', targetDate: '2026-12-01' })
        .success,
    ).toBe(false);
    expect(calendarDateSchema.safeParse('2026-02-29').success).toBe(false);
    expect(calendarDateSchema.safeParse('2028-02-29').success).toBe(true);
  });
  it('rejects negative, zero and fractional manual time', () => {
    for (const minutes of ['-1', '0', '1.5', '1441'])
      expect(
        manualTimeSchema.safeParse({ date: '2026-09-14', minutes }).success,
      ).toBe(false);
  });
  it('rounds timer intervals up to the next whole minute', () => {
    const value = {
      id: crypto.randomUUID(),
      startedAt: '2026-09-14T00:00:00.000Z',
      endedAt: '2026-09-14T00:01:59.999Z',
      durationMinutes: 2,
    };
    expect(sessionInputSchema.safeParse(value).success).toBe(true);
    expect(
      sessionInputSchema.safeParse({ ...value, durationMinutes: 1 }).success,
    ).toBe(false);
  });
  it('stores a non-zero interval shorter than a minute as one minute', () => {
    const value = {
      id: crypto.randomUUID(),
      startedAt: '2026-09-14T00:00:00.000Z',
      endedAt: '2026-09-14T00:00:09.000Z',
      durationMinutes: 1,
    };
    expect(sessionInputSchema.safeParse(value).success).toBe(true);
    expect(
      sessionInputSchema.safeParse({ ...value, durationMinutes: 0 }).success,
    ).toBe(false);
  });
});
