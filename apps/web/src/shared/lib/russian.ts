export function russianPlural(count: number, one: string, few: string, many: string): string {
  const absolute = Math.abs(count) % 100;
  const lastDigit = absolute % 10;

  if (absolute >= 11 && absolute <= 14) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= 4) return few;
  return many;
}

export function formatParticipantCount(count: number): string {
  return `${count} ${russianPlural(count, 'участник', 'участника', 'участников')}`;
}
