import type {UserDto} from '@taverna/contracts';
import {useState} from 'react';

import {ApiError, apiRequest} from '../../../../shared/api/client';

export function useGuestLogin(next: string) {
  const [error, setError] = useState<unknown>(null);
  const [isPending, setIsPending] = useState(false);

  return {
    error,
    isPending,
    mutate: () => {
      setError(null);
      setIsPending(true);
      void apiRequest<UserDto>('/auth/guest', {method: 'POST'})
        .then(() => {
          window.location.assign(next);
        })
        .catch((requestError: unknown) => {
          setError(requestError instanceof ApiError ? requestError : new Error('Не удалось войти как гость'));
          setIsPending(false);
        });
    },
  };
}
