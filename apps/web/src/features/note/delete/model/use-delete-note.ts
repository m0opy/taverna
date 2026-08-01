import {useMutation, useQueryClient} from '@tanstack/react-query';

import {notesQueryKey} from '../../../../entities/note/api/use-notes';
import {apiRequest} from '../../../../shared/api/client';

export function useDeleteNote(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => apiRequest<void>(`/campaigns/${campaignId}/notes/${noteId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: notesQueryKey(campaignId)});
    },
  });
}
