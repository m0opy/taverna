import {type CampaignDetailDto, type CoverKey} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import type {FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';

import {ApiError, apiRequest} from '../../../../shared/api/client';

export function useCreateCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [coverKey, setCoverKey] = useState<CoverKey>('tavern');
  const mutation = useMutation({
    mutationFn: () => apiRequest<CampaignDetailDto>('/campaigns', {method: 'POST', body: JSON.stringify({title, synopsis, coverKey})}),
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({queryKey: ['campaigns']});
      queryClient.setQueryData(['campaign', campaign.id], campaign);
      navigate(`/c/${campaign.id}`, {replace: true});
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return {
    coverKey,
    error: mutation.error instanceof ApiError ? mutation.error : null,
    isPending: mutation.isPending,
    setCoverKey,
    setSynopsis,
    setTitle,
    synopsis,
    submit,
    title,
  };
}
