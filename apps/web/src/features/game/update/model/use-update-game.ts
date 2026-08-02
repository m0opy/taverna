import type {GameDto, UpdateGameRequest} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {allGamesQueryKey} from '../../../../entities/game/api/use-games';
import {apiRequest} from '../../../../shared/api/client';

export function useUpdateGame(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({gameId, payload}: {gameId: string; payload: UpdateGameRequest}) => apiRequest<GameDto>(
      `/campaigns/${campaignId}/games/${gameId}`,
      {method: 'PATCH', body: JSON.stringify(payload)},
    ),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: allGamesQueryKey(campaignId)});
      void queryClient.invalidateQueries({queryKey: ['campaign', campaignId]});
      void queryClient.invalidateQueries({queryKey: ['campaigns']});
    },
  });
}
