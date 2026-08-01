import type {UserDto} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {apiRequest} from '../../../shared/api/client';

export const meQuery = {
  queryKey: ['me'] as const,
  queryFn: () => apiRequest<UserDto>('/auth/me'),
  retry: false,
};

export function useCurrentUser() {
  return useQuery(meQuery);
}
