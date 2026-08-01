import type {NoteDto, NoteWriteRequest} from '@taverna/contracts';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {notesQueryKey} from '../../../../entities/note/api/use-notes';
import {apiRequest} from '../../../../shared/api/client';

export function useEditNote(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({noteId, payload}: {noteId: string; payload: NoteWriteRequest}) => apiRequest<NoteDto>(
      `/campaigns/${campaignId}/notes/${noteId}`,
      {method: 'PATCH', body: JSON.stringify(payload)},
    ),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: notesQueryKey(campaignId)});
    },
  });
}
