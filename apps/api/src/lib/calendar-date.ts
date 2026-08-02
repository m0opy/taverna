import {AppError} from './errors.js';

export function calendarDateToUtcDate(value: string | null | undefined, field: string): Date | null {
  if (value === undefined || value === null) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
      fields: {[field]: 'Expected a valid calendar date'},
    });
  }

  return date;
}

export function serializeCalendarDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentCalendarDate(): string {
  return serializeCalendarDate(new Date())!;
}

export function monthRangeToUtcDates(value: string, field: string): {from: Date; until: Date} {
  const [year, month] = value.split('-').map(Number);
  const from = new Date(Date.UTC(year, month - 1, 1));
  if (from.getUTCFullYear() !== year || from.getUTCMonth() !== month - 1) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
      fields: {[field]: 'Expected a valid calendar month'},
    });
  }

  return {from, until: new Date(Date.UTC(year, month, 1))};
}
