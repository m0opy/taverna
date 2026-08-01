import {ApiError} from '../../../../shared/api/client';
import {authHref} from '../../../../shared/lib/navigation';

export function resolveJoinErrorRedirect(error: unknown, token: string): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === 'ALREADY_MEMBER' && typeof error.meta?.campaignId === 'string') {
    return `/c/${error.meta.campaignId}`;
  }
  if (error.status === 401) return authHref('/login', `/join/${token}`);
  return null;
}
