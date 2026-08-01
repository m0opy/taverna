import type {RotateInviteResponse} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {apiRequest} from '../../../../shared/api/client';

export function useRotateInvite(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<RotateInviteResponse>(`/campaigns/${campaignId}/invite/rotate`, {method: 'POST'}),
    onSuccess: () => void queryClient.invalidateQueries({queryKey: ['campaign', campaignId]}),
  });
}
