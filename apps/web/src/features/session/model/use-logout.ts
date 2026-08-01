import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';

import {apiRequest} from '../../../shared/api/client';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => apiRequest<void>('/auth/logout', {method: 'POST'}),
    onSuccess: () => {
      queryClient.clear();
      navigate('/login', {replace: true});
    },
  });
}
