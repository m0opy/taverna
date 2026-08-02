export function calendarDateToUtcDate(value: string): Date {
  const parts = value.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 0;
  const day = parts[2] ?? 0;
  return new Date(Date.UTC(year, month - 1, day));
}

export function calendarDateFromUtcDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentCalendarDate(): string {
  return calendarDateFromUtcDate(new Date());
}

export function monthFromCalendarDate(value: string): Date {
  const parts = value.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 0;
  return new Date(Date.UTC(year, month - 1, 1));
}

export function calendarMonthKey(value: Date): string {
  return calendarDateFromUtcDate(value).slice(0, 7);
}

export function formatCalendarMonth(value: Date): string {
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);
  return `${formatted.slice(0, 1).toLocaleUpperCase('ru-RU')}${formatted.slice(1)}`;
}
