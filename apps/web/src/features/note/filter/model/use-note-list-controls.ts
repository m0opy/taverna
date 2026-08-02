import type {NoteListSort} from '@taverna/contracts';
import {useSearchParams} from 'react-router-dom';

const defaultPage = 1;
const defaultPageSize = 10;
const defaultSort: NoteListSort = 'sessionDateDesc';
const noteSortValues = new Set<NoteListSort>([
  'sessionDateDesc',
  'sessionDateAsc',
  'updatedAtDesc',
  'updatedAtAsc',
]);

function positiveNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function useNoteListControls() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const nextSort = params.get('sort');
  const sort = nextSort && noteSortValues.has(nextSort as NoteListSort)
    ? (nextSort as NoteListSort)
    : defaultSort;
  const page = positiveNumber(params.get('page'), defaultPage);
  const pageSize = defaultPageSize;

  const update = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    next.delete('pageSize');
    mutate(next);
    setParams(next, {replace: true});
  };

  return {
    page,
    pageSize,
    search,
    sort,
    setPage: (nextPage: number) => {
      update((next) => {
        if (nextPage <= defaultPage) next.delete('page');
        else next.set('page', String(nextPage));
      });
    },
    setSearch: (nextSearch: string) => {
      update((next) => {
        const normalized = nextSearch.trim();
        if (normalized) next.set('search', normalized);
        else next.delete('search');
        next.delete('page');
      });
    },
    setSort: (nextSort: NoteListSort) => {
      update((next) => {
        if (nextSort === defaultSort) next.delete('sort');
        else next.set('sort', nextSort);
        next.delete('page');
      });
    },
  };
}
