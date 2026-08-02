import type {GameListResponse} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {apiRequest} from '../../../shared/api/client';

export const gamesQueryKey = (campaignId: string, month: string) => ['games', campaignId, month] as const;
export const allGamesQueryKey = (campaignId: string) => ['games', campaignId] as const;

export function useGames(campaignId: string, month: string) {
  return useQuery({
    queryKey: gamesQueryKey(campaignId, month),
    queryFn: () => apiRequest<GameListResponse>(`/campaigns/${campaignId}/games?month=${encodeURIComponent(month)}`),
    enabled: Boolean(campaignId && month),
  });
}
