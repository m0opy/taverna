import type {CreateGameRequest, GameDto} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {allGamesQueryKey} from '../../../../entities/game/api/use-games';
import {apiRequest} from '../../../../shared/api/client';

export function useCreateGame(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGameRequest) => apiRequest<GameDto>(`/campaigns/${campaignId}/games`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: allGamesQueryKey(campaignId)});
      void queryClient.invalidateQueries({queryKey: ['campaign', campaignId]});
      void queryClient.invalidateQueries({queryKey: ['campaigns']});
    },
  });
}
