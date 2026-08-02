import type {CampaignDetailDto, NoteDto, NoteListSort} from '@taverna/contracts';
import {Funnel, FunnelXmark} from '@gravity-ui/icons';
import {Button} from '@gravity-ui/uikit';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {useCampaign} from '../../../entities/campaign/api/use-campaigns';
import {useNotes} from '../../../entities/note/api/use-notes';
import {useDeleteNote} from '../../../features/note/delete/model/use-delete-note';
import {useNoteListControls} from '../../../features/note/filter/model/use-note-list-controls';
import {ApiError} from '../../../shared/api/client';
import {useDocumentTitle} from '../../../shared/lib/use-document-title';
import {ConfirmDialog} from '../../../shared/ui/ConfirmDialog';
import {Pagination} from '../../../shared/ui/Pagination';
import {CampaignDetailErrorState} from '../../../widgets/campaign-detail/ui/CampaignDetail';
import {CampaignTabs} from '../../../widgets/campaign-detail/ui/CampaignTabs';
import {NoteEditor} from '../../../widgets/note-editor/ui/NoteEditor';
import {NotesList} from '../../../widgets/notes-list/ui/NotesList';
import styles from './CampaignNotesPage.module.css';

const sortLabels: Record<NoteListSort, string> = {
  sessionDateDesc: 'Сессии: сначала новые',
  sessionDateAsc: 'Сессии: сначала старые',
  updatedAtDesc: 'Правки: сначала новые',
  updatedAtAsc: 'Правки: сначала старые',
};

export function CampaignNotesPage() {
  const {id = ''} = useParams<{id: string}>();
  const campaign = useCampaign(id);
  const {page, pageSize, search, setPage, setSearch, setSort, sort} = useNoteListControls();
  const notes = useNotes(id, {
    search: search || undefined,
    sort,
    page,
    pageSize,
  });
  const deleteNote = useDeleteNote(id);
  const [editor, setEditor] = useState<'create' | NoteDto | null>(null);

  useDocumentTitle(campaign.data ? 'Заметки' : undefined, campaign.data?.title, !campaign.data ? 'Заметки' : undefined);

  useEffect(() => {
    if (notes.data && notes.data.meta.page !== page) {
      setPage(notes.data.meta.page);
    }
  }, [notes.data, page, setPage]);

  if (campaign.isPending) {
    return <main className={styles.page}><p className={styles.statusMessage}>Открываем хронику…</p></main>;
  }

  if (campaign.isError || !campaign.data) {
    const status = campaign.error instanceof ApiError ? campaign.error.status : null;
    return <CampaignDetailErrorState status={status} onRetry={() => void campaign.refetch()} />;
  }

  return (
    <CampaignNotesView
      campaign={campaign.data}
      deleteNote={deleteNote}
      editor={editor}
      id={id}
      notes={notes}
      onEditorChange={setEditor}
      pageSize={pageSize}
      search={search}
      setPage={setPage}
      setSearch={setSearch}
      setSort={setSort}
      sort={sort}
    />
  );
}

function CampaignNotesView({
  campaign,
  deleteNote,
  editor,
  id,
  notes,
  onEditorChange,
  pageSize,
  search,
  setPage,
  setSearch,
  setSort,
  sort,
}: {
  campaign: CampaignDetailDto;
  deleteNote: ReturnType<typeof useDeleteNote>;
  editor: 'create' | NoteDto | null;
  id: string;
  notes: ReturnType<typeof useNotes>;
  onEditorChange: (value: 'create' | NoteDto | null) => void;
  pageSize: number;
  search: string;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setSort: (sort: NoteListSort) => void;
  sort: NoteListSort;
}) {
  const [noteToDelete, setNoteToDelete] = useState<NoteDto | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const deleteErrorMessage = deleteNote.error
    ? deleteNote.error instanceof ApiError
      ? deleteNote.error.status === 403
        ? 'У вас нет права удалить эту заметку.'
        : deleteNote.error.message
      : 'Не удалось удалить заметку. Проверьте соединение и попробуйте ещё раз.'
    : null;

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Кампания · {campaign.title}</p>
          <h1>Заметки <span>· {notes.data?.meta.totalItems ?? '…'}</span></h1>
        </div>
        <div className={styles.headingActions}>
          <Button
            aria-controls="notes-list-controls"
            aria-expanded={isFiltersOpen}
            aria-label={isFiltersOpen ? 'Скрыть фильтры' : 'Показать фильтры'}
            className={styles.filterToggle ?? ''}
            size="l"
            title={isFiltersOpen ? 'Скрыть фильтры' : 'Показать фильтры'}
            type="button"
            view="flat-secondary"
            onClick={() => setIsFiltersOpen((open) => !open)}
          >
            {isFiltersOpen ? (
              <FunnelXmark aria-hidden="true" style={{transform: 'translateY(3px)'}} />
            ) : (
              <Funnel aria-hidden="true" style={{transform: 'translateY(3px)'}} />
            )}
          </Button>
          <Button className={styles.createButton ?? ''} view="action" size="l" onClick={() => onEditorChange('create')}>
            Написать заметку
          </Button>
        </div>
      </header>

      <CampaignTabs campaignId={id} isOwner={campaign.myRole === 'master'} section="notes" />

      {isFiltersOpen && (
        <section className={styles.controls} id="notes-list-controls" aria-label="Управление списком заметок">
          <label className={styles.controlField}>
            <span>Поиск</span>
            <input
              type="search"
              value={search}
              placeholder="Текст заметки, игрок или персонаж"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className={styles.controlField}>
            <span>Сортировка</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as NoteListSort)}>
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          {notes.data?.meta.search && (
            <p className={styles.resultsMeta}>
              Найдено {notes.data.meta.totalItems} заметок по запросу.
            </p>
          )}
        </section>
      )}

      {editor && (
        <NoteEditor
          campaignId={id}
          key={editor === 'create' ? 'create' : editor.id}
          note={editor === 'create' ? null : editor}
          onCancel={() => onEditorChange(null)}
          onSaved={() => onEditorChange(null)}
        />
      )}

      {deleteErrorMessage && (
        <p className={styles.actionError} role="alert">
          {deleteErrorMessage}
        </p>
      )}

      {notes.isPending ? (
        <p className={styles.statusMessage}>Собираем заметки…</p>
      ) : notes.isError || !notes.data ? (
        <NotesErrorState error={notes.error} onRetry={() => void notes.refetch()} />
      ) : (
        <NotesList
          {...(deleteNote.isPending && deleteNote.variables ? {deletingNoteId: deleteNote.variables} : {})}
          items={notes.data.items}
          onCreate={() => onEditorChange('create')}
          onDelete={setNoteToDelete}
          onEdit={(note) => onEditorChange(note)}
          search={search}
          showEmptyState={!editor}
        />
      )}

      {notes.data && notes.data.meta.totalPages > 1 && (
        <Pagination
          ariaLabel="Страницы заметок"
          className={styles.pagination}
          page={notes.data.meta.page}
          pageSize={pageSize}
          total={notes.data.meta.totalItems}
          onUpdate={(nextPage) => setPage(nextPage)}
        />
      )}

      {noteToDelete && (
        <ConfirmDialog
          description="Заметка будет удалена без возможности восстановления."
          isPending={deleteNote.isPending}
          title="Удалить заметку?"
          onCancel={() => setNoteToDelete(null)}
          onConfirm={() => deleteNote.mutate(noteToDelete.id, {onSuccess: () => setNoteToDelete(null)})}
        />
      )}
    </main>
  );
}

export function NotesErrorState({error, onRetry}: {error: unknown; onRetry: () => void}) {
  const status = error instanceof ApiError ? error.status : null;
  const title = status === 403 ? 'Нет доступа к заметкам' : status === 404 ? 'Кампания не найдена' : 'Заметки недоступны';
  const message = status === 403
    ? 'Только активные участники кампании могут читать её заметки.'
    : status === 404
      ? 'Проверьте ссылку на кампанию.'
      : 'Проверьте соединение и попробуйте ещё раз.';

  useDocumentTitle(title);

  return (
    <section className={styles.errorState} role="alert">
      <p className={styles.eyebrow}>{status ?? 'Ошибка'}</p>
      <h2>{title}</h2>
      <p>{message}</p>
      <Button view="action" size="l" onClick={onRetry}>Повторить</Button>
    </section>
  );
}

export default CampaignNotesPage;
