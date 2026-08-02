import type {HealthResponse} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {apiRequest} from '../../../../shared/api/client';

const demoLoginAvailabilityQuery = {
  queryKey: ['health', 'demo-login-availability'] as const,
  queryFn: () => apiRequest<HealthResponse>('/health'),
  retry: false,
  staleTime: 60_000,
};

export function useDemoLoginAvailability() {
  const query = useQuery(demoLoginAvailabilityQuery);

  return {
    isAvailable: query.data?.demoLoginAvailable === true,
    isKnown: query.isSuccess,
  };
}
