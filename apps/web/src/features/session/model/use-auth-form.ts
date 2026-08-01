import type {UserDto} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import type {FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';

import {ApiError, apiRequest} from '../../../shared/api/client';

export type AuthMode = 'login' | 'register';

export function useAuthForm(mode: AuthMode, next: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => apiRequest<UserDto>(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(mode === 'login' ? {email, password} : {name, email, password}),
    }),
    onSuccess: (user) => {
      navigate(next, {replace: true, flushSync: true});
      queryClient.setQueryData(['me'], user);
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
