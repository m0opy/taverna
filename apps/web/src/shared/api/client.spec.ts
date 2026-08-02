import {afterEach, describe, expect, it, vi} from 'vitest';

import {ApiError, apiRequest} from './client';
import {subscribeUnauthorized} from './auth-events';
import {safeNext} from '../lib/navigation';

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest', () => {
  it('reads the nested error envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({error: {
      code: 'ALREADY_MEMBER', message: 'Уже в кампании', meta: {campaignId: 'campaign-1'}, requestId: 'req-1',
    }}), {status: 409, headers: {'Content-Type': 'application/json'}})));

    const error = await apiRequest('/invites/token/join', {method: 'POST', body: '{}'}).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({status: 409, code: 'ALREADY_MEMBER', message: 'Уже в кампании', meta: {campaignId: 'campaign-1'}});
  });

  it('localizes english validation and duplicate-email errors into actionable russian copy', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      fields: {
        name: 'Too small: expected string to have >=2 characters',
        email: 'Invalid email address',
        password: 'Too small: expected string to have >=8 characters',
      },
    }}), {status: 400, headers: {'Content-Type': 'application/json'}})));

    const error = await apiRequest('/auth/register', {method: 'POST', body: '{}'}).catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Проверьте поля формы и попробуйте снова.',
      fields: {
        name: 'Имя должно быть не короче 2 символов',
        email: 'Введите корректный email',
        password: 'Пароль должен быть не короче 8 символов',
      },
    });
  });

  it('localizes duplicate email conflicts from english server responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({error: {
      code: 'EMAIL_TAKEN',
      message: 'Email is already registered',
      fields: {email: 'Email is already registered'},
    }}), {status: 409, headers: {'Content-Type': 'application/json'}})));

    const error = await apiRequest('/auth/register', {method: 'POST', body: '{}'}).catch((value: unknown) => value);

    expect(error).toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
      message: 'Этот email уже зарегистрирован',
      fields: {email: 'Этот email уже зарегистрирован'},
    });
  });

  it('wraps network failures in a localized ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }));

    const error = await apiRequest('/auth/login', {method: 'POST', body: '{}'}).catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Не удалось связаться с таверной. Проверьте соединение и попробуйте снова.',
    });
  });

  it('broadcasts non-auth 401 responses for a global session reset', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUnauthorized(listener);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({error: {
      code: 'SESSION_EXPIRED',
      message: 'Session expired',
    }}), {status: 401, headers: {'Content-Type': 'application/json'}})));

    await apiRequest('/campaigns', {method: 'GET'}).catch(() => null);
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({
      status: 401,
      code: 'SESSION_EXPIRED',
      message: 'Сессия истекла. Войдите снова.',
    });
  });
});

describe('safeNext', () => {
  it('keeps local paths and rejects protocol-relative redirects', () => {
    expect(safeNext('/join/token?from=invite')).toBe('/join/token?from=invite');
    expect(safeNext('//evil.example/path')).toBe('/campaigns');
    expect(safeNext('https://evil.example/path')).toBe('/campaigns');
  });
});
