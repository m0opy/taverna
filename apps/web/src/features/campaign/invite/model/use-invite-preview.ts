import type {InvitePreviewDto} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {ApiError, apiRequest} from '../../../../shared/api/client';

export function useInvitePreview(token: string) {
  const query = useQuery({
    queryKey: ['invite', token],
    queryFn: () => apiRequest<InvitePreviewDto>(`/invites/${token}`),
    retry: false,
    enabled: Boolean(token),
  });

  return {
    ...query,
    error: query.error instanceof ApiError ? query.error : null,
  };
}
