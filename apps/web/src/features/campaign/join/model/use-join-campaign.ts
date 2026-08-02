import type {JoinCampaignResponse} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import type {FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';

import {useCurrentUser} from '../../../../entities/session/api/me-query';
import {useInvitePreview} from '../../invite/model/use-invite-preview';
import {ApiError, apiRequest} from '../../../../shared/api/client';
import {resolveJoinErrorRedirect} from './resolve-join-error';

export function useJoinCampaign(token: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useCurrentUser();
  const preview = useInvitePreview(token);
  const [characterName, setCharacterNameState] = useState('');
  const [characterClass, setCharacterClassState] = useState('');
  const [characterInfo, setCharacterInfo] = useState('');
  const join = useMutation({
    mutationFn: () => apiRequest<JoinCampaignResponse>(`/invites/${token}/join`, {
      method: 'POST',
      body: JSON.stringify({characterName, characterClass, characterInfo}),
    }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({queryKey: ['campaigns']});
      navigate(`/c/${result.campaignId}`, {replace: true, state: {notice: 'Вы вступили в кампанию.'}});
    },
    onError: (error) => {
      const redirect = resolveJoinErrorRedirect(error, token);
      if (redirect) navigate(redirect, {replace: true});
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    join.mutate();
  };

  const setCharacterName = (value: string) => setCharacterNameState(value.slice(0, 40));
  const setCharacterClass = (value: string) => setCharacterClassState(value.slice(0, 60));

  return {
    characterClass,
    characterInfo,
    characterName,
    isGuest: me.isSuccess && me.data === null,
    isPending: join.isPending,
    joinFieldErrors: join.error instanceof ApiError ? join.error.fields : undefined,
    joinError: join.error instanceof ApiError ? join.error : null,
    me,
    preview,
    previewError: preview.error,
    setCharacterClass,
    setCharacterInfo,
    setCharacterName,
    submit,
  };
}
