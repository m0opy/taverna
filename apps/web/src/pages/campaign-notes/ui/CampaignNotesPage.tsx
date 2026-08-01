import type {CampaignDetailDto, NoteDto} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import {useState} from 'react';
import {useParams} from 'react-router-dom';

import {useCampaign} from '../../../entities/campaign/api/use-campaigns';
import {useNotes} from '../../../entities/note/api/use-notes';
import {useDeleteNote} from '../../../features/note/delete/model/use-delete-note';
import {CampaignDetailErrorState} from '../../../widgets/campaign-detail/ui/CampaignDetail';
import {CampaignTabs} from '../../../widgets/campaign-detail/ui/CampaignTabs';
import {NoteEditor} from '../../../widgets/note-editor/ui/NoteEditor';
import {NotesList} from '../../../widgets/notes-list/ui/NotesList';
import {ApiError} from '../../../shared/api/client';
import {ConfirmDialog} from '../../../shared/ui/ConfirmDialog';
import styles from './CampaignNotesPage.module.css';

export function CampaignNotesPage() {
  const {id = ''} = useParams<{id: string}>();
  const campaign = useCampaign(id);
  const notes = useNotes(id);
  const deleteNote = useDeleteNote(id);
  const [editor, setEditor] = useState<'create' | NoteDto | null>(null);

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
}: {
  campaign: CampaignDetailDto;
  deleteNote: ReturnType<typeof useDeleteNote>;
  editor: 'create' | NoteDto | null;
  id: string;
  notes: ReturnType<typeof useNotes>;
  onEditorChange: (value: 'create' | NoteDto | null) => void;
}) {
  const [noteToDelete, setNoteToDelete] = useState<NoteDto | null>(null);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Кампания · {campaign.title}</p>
          <h1>Заметки</h1>
        </div>
        <Button view="action" size="l" onClick={() => onEditorChange('create')}>
          Написать заметку
        </Button>
      </header>

      <CampaignTabs campaignId={id} isOwner={campaign.myRole === 'master'} section="notes" />

      {editor && (
        <NoteEditor
          campaignId={id}
          key={editor === 'create' ? 'create' : editor.id}
          note={editor === 'create' ? null : editor}
          onCancel={() => onEditorChange(null)}
          onSaved={() => onEditorChange(null)}
        />
      )}

      {deleteNote.error && (
        <p className={styles.actionError} role="alert">
          {deleteNote.error instanceof ApiError && deleteNote.error.status === 403
            ? 'У вас нет права удалить эту заметку.'
            : 'Не удалось удалить заметку. Попробуйте ещё раз.'}
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

  return (
    <section className={styles.errorState} role="alert">
      <p className={styles.eyebrow}>{status ?? 'Ошибка'}</p>
      <h2>{title}</h2>
      <p>{message}</p>
      <button className={styles.retryButton} type="button" onClick={onRetry}>Повторить</button>
    </section>
  );
}
