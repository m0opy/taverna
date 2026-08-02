import type {NpcListResponse} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {apiRequest} from '../../../shared/api/client';

export const npcsQueryKey = (campaignId: string, tag?: string) => ['campaign-npcs', campaignId, tag ?? null] as const;
export const allNpcsQueryKey = (campaignId: string) => ['campaign-npcs', campaignId] as const;

export function useNpcs(campaignId: string, tag?: string) {
  const query = tag
    ? `/campaigns/${campaignId}/npcs?tag=${encodeURIComponent(tag)}`
    : `/campaigns/${campaignId}/npcs`;

  return useQuery({
    queryKey: npcsQueryKey(campaignId, tag),
    queryFn: () => apiRequest<NpcListResponse>(query),
    enabled: Boolean(campaignId),
    placeholderData: (previousData) => previousData,
  });
}
