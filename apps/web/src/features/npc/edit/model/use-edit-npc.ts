import type {NpcDto, NpcWriteRequest} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {allNpcsQueryKey} from '../../../../entities/npc/api/use-npcs';
import {apiRequest} from '../../../../shared/api/client';

export function useEditNpc(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({npcId, payload}: {npcId: string; payload: NpcWriteRequest}) => apiRequest<NpcDto>(
      `/campaigns/${campaignId}/npcs/${npcId}`,
      {method: 'PATCH', body: JSON.stringify(payload)},
    ),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: allNpcsQueryKey(campaignId)});
    },
  });
}
