import {afterEach, describe, expect, it, vi} from 'vitest';

import {ApiError, apiRequest} from './client';
import {safeNext} from '../lib/navigation';

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest', () => {
  it('handles a 204 response without parsing JSON or sending an empty JSON body', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
      return new Response(null, {status: 204});
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest<void>('/auth/logout', {method: 'POST'})).resolves.toBeUndefined();
  });

  it('reads the nested error envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({error: {
      code: 'ALREADY_MEMBER', message: 'Уже в кампании', meta: {campaignId: 'campaign-1'}, requestId: 'req-1',
    }}), {status: 409, headers: {'Content-Type': 'application/json'}})));

    const error = await apiRequest('/invites/token/join', {method: 'POST', body: '{}'}).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({status: 409, code: 'ALREADY_MEMBER', message: 'Уже в кампании', meta: {campaignId: 'campaign-1'}});
  });
});

describe('safeNext', () => {
  it('keeps local paths and rejects protocol-relative redirects', () => {
    expect(safeNext('/join/token?from=invite')).toBe('/join/token?from=invite');
    expect(safeNext('//evil.example/path')).toBe('/campaigns');
    expect(safeNext('https://evil.example/path')).toBe('/campaigns');
  });
});
