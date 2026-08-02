import {afterEach, describe, expect, it, vi} from 'vitest';

import {meQuery} from '../../src/entities/session/api/me-query';
import {authPath, authPayload} from '../../src/features/auth/model/auth-request';
import {apiRequest} from '../../src/shared/api/client';

afterEach(() => vi.unstubAllGlobals());

describe('auth request boundaries', () => {
  it('handles the logout response without parsing an empty JSON body', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
      return new Response(null, {status: 204});
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest<void>('/auth/logout', {method: 'POST'})).resolves.toBeUndefined();
  });

  it('keeps login and register on the existing API paths and payloads', () => {
    expect(authPath('login')).toBe('/auth/login');
    expect(authPayload('login', {name: '', email: 'hero@example.test', password: 'password'})).toEqual({
      email: 'hero@example.test',
      password: 'password',
    });
    expect(authPath('register')).toBe('/auth/register');
    expect(authPayload('register', {name: 'Лорас', email: 'hero@example.test', password: 'password'})).toEqual({
      name: 'Лорас',
      email: 'hero@example.test',
      password: 'password',
    });
  });

  it('restores the current user through the session endpoint with cookies', async () => {
    const user = {
      id: '4b6f1a4b-1e52-4dd5-9e1e-f2e2f1ee6b95',
      name: 'Лорас',
      email: 'hero@example.test',
      createdAt: '2026-08-01T10:00:00.000Z',
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('/api/auth/me');
      expect(init?.credentials).toBe('include');
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(meQuery.queryFn()).resolves.toEqual(user);
  });

  it('treats a 401 session check as a logged-out state instead of a route-breaking error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({error: {
      code: 'SESSION_EXPIRED',
      message: 'Session expired',
    }}), {
      status: 401,
      headers: {'Content-Type': 'application/json'},
    })));

    await expect(meQuery.queryFn()).resolves.toBeNull();
  });
});
