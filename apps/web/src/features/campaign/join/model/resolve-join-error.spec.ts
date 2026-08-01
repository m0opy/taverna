import {describe, expect, it} from 'vitest';

import {ApiError} from '../../../../shared/api/client';
import {resolveJoinErrorRedirect} from './resolve-join-error';

describe('resolveJoinErrorRedirect', () => {
  it('preserves redirects for repeated membership and expired auth', () => {
    expect(resolveJoinErrorRedirect(
      new ApiError(409, 'Уже в кампании', 'ALREADY_MEMBER', undefined, {campaignId: 'campaign-1'}),
      'invite-token',
    )).toBe('/c/campaign-1');
    expect(resolveJoinErrorRedirect(new ApiError(401, 'Нужен вход'), 'invite-token'))
      .toBe('/login?next=%2Fjoin%2Finvite-token');
  });

  it('does not redirect unrelated errors', () => {
    expect(resolveJoinErrorRedirect(new ApiError(500, 'Ошибка'), 'invite-token')).toBeNull();
  });
});
