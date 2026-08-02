import type {UserDto} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {ApiError, apiRequest} from '../../../shared/api/client';

export const meQuery = {
  queryKey: ['me'] as const,
  queryFn: async () => {
    try {
      return await apiRequest<UserDto>('/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },
  retry: false,
};

export function useCurrentUser() {
  return useQuery(meQuery);
}
