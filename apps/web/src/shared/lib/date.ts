export function formatCampaignDate(value: string | null): string {
  if (!value) return 'Не назначена';

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatNextSessionMeta(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '';

  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = new Intl.DateTimeFormat('ru-RU', {weekday: 'long', timeZone: 'UTC'}).format(date);
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = Math.round((date.getTime() - todayUtc) / 86_400_000);
  const relative = days === 0
    ? 'сегодня'
    : days === 1
      ? 'завтра'
      : days === -1
        ? 'вчера'
        : `${new Intl.NumberFormat('ru-RU').format(Math.abs(days))} дн. ${days > 0 ? 'до игры' : 'назад'}`;

  return `${weekday.slice(0, 1).toLocaleUpperCase('ru-RU')}${weekday.slice(1)} · ${relative}`;
}
