import type {NpcDto, NpcWriteRequest} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {allNpcsQueryKey} from '../../../../entities/npc/api/use-npcs';
import {apiRequest} from '../../../../shared/api/client';

export function useCreateNpc(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NpcWriteRequest) => apiRequest<NpcDto>(`/campaigns/${campaignId}/npcs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: allNpcsQueryKey(campaignId)});
    },
  });
}
