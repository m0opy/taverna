import type {CampaignDetailDto, CampaignListResponse} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {apiRequest} from '../../../shared/api/client';

export function useCampaigns() {
  return useQuery({queryKey: ['campaigns'], queryFn: () => apiRequest<CampaignListResponse>('/campaigns')});
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiRequest<CampaignDetailDto>(`/campaigns/${id}`),
    enabled: Boolean(id),
  });
}
