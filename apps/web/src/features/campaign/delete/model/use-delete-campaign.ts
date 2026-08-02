import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';

import {apiRequest} from '../../../../shared/api/client';

export function useDeleteCampaign(campaignId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (confirmationTitle: string) => apiRequest<void>(`/campaigns/${campaignId}`, {method: 'DELETE', body: JSON.stringify({confirmationTitle})}),
    onSuccess: () => {
      queryClient.removeQueries({queryKey: ['campaign', campaignId]});
      void queryClient.invalidateQueries({queryKey: ['campaigns']});
      navigate('/campaigns', {replace: true, state: {notice: 'Кампания удалена.'}});
    },
  });
}
