import type {CampaignDetailDto, UpdateCampaignRequest} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {allGamesQueryKey} from '../../../../entities/game/api/use-games';
import {apiRequest} from '../../../../shared/api/client';

export function useUpdateCampaign(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCampaignRequest) =>
      apiRequest<CampaignDetailDto>(`/campaigns/${campaignId}`, {method: 'PATCH', body: JSON.stringify(payload)}),
    onSuccess: (campaign) => {
      queryClient.setQueryData(['campaign', campaignId], campaign);
      void queryClient.invalidateQueries({queryKey: ['campaigns']});
      void queryClient.invalidateQueries({queryKey: allGamesQueryKey(campaignId)});
    },
  });
}
