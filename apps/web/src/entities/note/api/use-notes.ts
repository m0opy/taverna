import type {NoteListResponse} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {apiRequest} from '../../../shared/api/client';

export const notesQueryKey = (campaignId: string) => ['campaign-notes', campaignId] as const;

export function useNotes(campaignId: string) {
  return useQuery({
    queryKey: notesQueryKey(campaignId),
    queryFn: () => apiRequest<NoteListResponse>(`/campaigns/${campaignId}/notes`),
    enabled: Boolean(campaignId),
  });
}
