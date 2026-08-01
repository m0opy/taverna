import type {UserDto} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import type {FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';

import {ApiError, apiRequest} from '../../../shared/api/client';
import {meQuery} from '../../../entities/session/api/me-query';
import {authPath, authPayload, type AuthFormValues, type AuthMode} from './auth-request';

export function useAuthForm(mode: AuthMode, next: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => {
      const values: AuthFormValues = {name, email, password};
      return apiRequest<UserDto>(authPath(mode), {
        method: 'POST',
        body: JSON.stringify(authPayload(mode, values)),
      });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(meQuery.queryKey, user);
      navigate(next, {replace: true, flushSync: true});
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return {
    email,
    error: mutation.error instanceof ApiError ? mutation.error : null,
    isPending: mutation.isPending,
    name,
    password,
    setEmail,
    setName,
    setPassword,
    submit,
  };
}
