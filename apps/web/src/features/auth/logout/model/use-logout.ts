import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';

import {meQuery} from '../../../../entities/session/api/me-query';
import {apiRequest} from '../../../../shared/api/client';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => apiRequest<void>('/auth/logout', {method: 'POST'}),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(meQuery.queryKey, null);
      navigate('/login', {replace: true});
    },
  });
}
