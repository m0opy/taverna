import type {NoteListQuery, NoteListResponse} from '@taverna/contracts';
import {useQuery} from '@tanstack/react-query';

import {apiRequest} from '../../../shared/api/client';

const defaultPage = 1;
const defaultPageSize = 10;
const defaultSort = 'sessionDateDesc';

export const allNotesQueryKey = (campaignId: string) => ['campaign-notes', campaignId] as const;

export const notesQueryKey = (campaignId: string, query: NoteListQuery = {}) => [
  ...allNotesQueryKey(campaignId),
  query.search?.trim() ?? '',
  query.sort ?? defaultSort,
  query.page ?? defaultPage,
  query.pageSize ?? defaultPageSize,
] as const;

function notesPath(campaignId: string, query: NoteListQuery) {
  const params = new URLSearchParams();
  const search = query.search?.trim();

  if (search) {
    params.set('search', search);
  }
  if (query.sort && query.sort !== defaultSort) {
    params.set('sort', query.sort);
  }
  if (query.page && query.page !== defaultPage) {
    params.set('page', String(query.page));
  }
  if (query.pageSize && query.pageSize !== defaultPageSize) {
    params.set('pageSize', String(query.pageSize));
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return `/campaigns/${campaignId}/notes${suffix}`;
}

export function useNotes(campaignId: string, query: NoteListQuery = {}) {
  return useQuery({
    queryKey: notesQueryKey(campaignId, query),
    queryFn: () => apiRequest<NoteListResponse>(notesPath(campaignId, query)),
    enabled: Boolean(campaignId),
  });
}
