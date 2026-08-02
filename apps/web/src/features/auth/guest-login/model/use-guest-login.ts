import type {UserDto} from '@taverna/contracts';
import {useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {ApiError, apiRequest} from '../../../../shared/api/client';
import {meQuery} from '../../../../entities/session/api/me-query';

export function useGuestLogin(next: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<unknown>(null);
  const [isPending, setIsPending] = useState(false);

  return {
    error,
    isPending,
    mutate: () => {
      setError(null);
      setIsPending(true);
      void apiRequest<UserDto>('/auth/guest', {method: 'POST'})
        .then((user) => {
          queryClient.setQueryData(meQuery.queryKey, user);
          void navigate(next, {replace: true});
        })
        .catch((requestError: unknown) => {
          setError(requestError instanceof ApiError ? requestError : new Error('Не удалось войти как гость'));
          setIsPending(false);
        });
    },
  };
}
