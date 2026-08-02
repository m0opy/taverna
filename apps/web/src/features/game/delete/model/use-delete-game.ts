import {useMutation, useQueryClient} from '@tanstack/react-query';

import {allGamesQueryKey} from '../../../../entities/game/api/use-games';
import {apiRequest} from '../../../../shared/api/client';

export function useDeleteGame(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gameId: string) => apiRequest<void>(`/campaigns/${campaignId}/games/${gameId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: allGamesQueryKey(campaignId)});
      void queryClient.invalidateQueries({queryKey: ['campaign', campaignId]});
      void queryClient.invalidateQueries({queryKey: ['campaigns']});
    },
  });
}
