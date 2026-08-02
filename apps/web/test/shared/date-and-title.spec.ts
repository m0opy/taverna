import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {formatNextSessionMeta} from '../../src/shared/lib/date';
import {buildDocumentTitle} from '../../src/shared/lib/title';

describe('document title formatting', () => {
  it('adds the app name only once for contextual titles', () => {
    expect(buildDocumentTitle('Заметки', 'Пепел Северной башни')).toBe('Заметки · Пепел Северной башни · Таверна');
    expect(buildDocumentTitle()).toBe('Таверна');
  });
});

describe('next session meta formatting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('capitalizes the weekday while preserving relative shortcuts', () => {
    expect(formatNextSessionMeta('2026-08-03')).toBe('Понедельник · завтра');
  });

  it('groups large day counts with the Russian locale', () => {
    const today = Date.UTC(2026, 7, 2);
    const target = Date.UTC(2030, 3, 29);
    const days = Math.round((target - today) / 86_400_000);

    expect(formatNextSessionMeta('2030-04-29')).toContain(`${new Intl.NumberFormat('ru-RU').format(days)} дн. до игры`);
  });
});
