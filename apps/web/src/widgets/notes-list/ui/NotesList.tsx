import type {NoteDto} from '@taverna/contracts';

import {groupNotesBySession} from '../../../entities/note/lib/group-notes';
import {NoteCard} from '../../../entities/note/ui/NoteCard';
import styles from './NotesList.module.css';

interface NotesListProps {
  deletingNoteId?: string;
  items: NoteDto[];
  onCreate: () => void;
  onDelete: (note: NoteDto) => void;
  onEdit: (note: NoteDto) => void;
  search?: string;
  showEmptyState?: boolean;
}

export function NotesList({
  deletingNoteId,
  items,
  onCreate,
  onDelete,
  onEdit,
  search,
  showEmptyState = true,
}: NotesListProps) {
  if (items.length === 0) {
    if (!showEmptyState) {
      return null;
    }

    const hasSearch = Boolean(search?.trim());
    return (
      <section className={styles.emptyState}>
        <div className={styles.emptySigil} aria-hidden="true">✦</div>
        <h2>{hasSearch ? 'Ничего не найдено' : 'Пока нет ни одной заметки'}</h2>
        <p>{hasSearch ? 'Попробуйте изменить запрос или очистить поиск.' : 'Запишите, что произошло на последней сессии.'}</p>
        {!hasSearch && (
          <button className={styles.primaryAction} type="button" onClick={onCreate}>
            Написать заметку
          </button>
        )}
      </section>
    );
  }

  return (
    <div className={styles.groups} aria-label="Заметки кампании">
      {groupNotesBySession(items).map((group) => (
        <section className={styles.group} key={group.key}>
          <h2 className={styles.groupTitle}>{group.label}</h2>
          <div>
            {group.notes.map((note) => (
              <NoteCard
                isDeleting={deletingNoteId === note.id}
                key={note.id}
                note={note}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
