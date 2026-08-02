import {describe, expect, it} from 'vitest';

import {
  calendarDateFromUtcDate,
  calendarDateToUtcDate,
  calendarMonthKey,
  monthFromCalendarDate,
} from '../../src/shared/lib/calendar';

describe('calendar date helpers', () => {
  it('keeps a calendar date stable in UTC at month and year boundaries', () => {
    expect(calendarDateFromUtcDate(calendarDateToUtcDate('2026-12-31'))).toBe('2026-12-31');
    expect(calendarMonthKey(monthFromCalendarDate('2027-01-01'))).toBe('2027-01');
  });
});
