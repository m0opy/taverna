import {useMutation, useQueryClient} from '@tanstack/react-query';

import {allNpcsQueryKey} from '../../../../entities/npc/api/use-npcs';
import {apiRequest} from '../../../../shared/api/client';

export function useDeleteNpc(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (npcId: string) => apiRequest<void>(`/campaigns/${campaignId}/npcs/${npcId}`, {method: 'DELETE'}),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: allNpcsQueryKey(campaignId)});
    },
  });
}
