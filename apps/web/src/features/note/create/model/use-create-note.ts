import type {NoteDto, NoteWriteRequest} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {allNotesQueryKey} from '../../../../entities/note/api/use-notes';
import {apiRequest} from '../../../../shared/api/client';

export function useCreateNote(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NoteWriteRequest) => apiRequest<NoteDto>(`/campaigns/${campaignId}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: allNotesQueryKey(campaignId)});
    },
  });
}
