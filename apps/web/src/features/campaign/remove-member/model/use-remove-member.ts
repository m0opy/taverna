import {useMutation, useQueryClient} from '@tanstack/react-query';

import {apiRequest} from '../../../../shared/api/client';

export function useRemoveMember(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => apiRequest<void>(`/campaigns/${campaignId}/members/${membershipId}`, {method: 'DELETE'}),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['campaign', campaignId]});
      void queryClient.invalidateQueries({queryKey: ['campaigns']});
    },
  });
}
