import type {NoteDto} from '@taverna/contracts';

import {formatNoteTimestamp, noteAuthorLabel} from '../model/presentation';
import styles from './NoteCard.module.css';

interface NoteCardProps {
  isDeleting?: boolean;
  note: NoteDto;
  onDelete: (note: NoteDto) => void;
  onEdit: (note: NoteDto) => void;
}

export function NoteCard({isDeleting = false, note, onDelete, onEdit}: NoteCardProps) {
  const isEdited = note.updatedAt !== note.createdAt;

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <p className={styles.author}>{noteAuthorLabel(note)}</p>
          <p className={styles.meta}>
            {note.author.characterName ? `${note.author.userName} · ` : ''}
            {formatNoteTimestamp(note.createdAt)}
            {isEdited ? ' · изменено' : ''}
            {!note.author.isActive ? ' · участник вышел' : ''}
          </p>
        </div>
        {(note.canEdit || note.canDelete) && (
          <div className={styles.actions}>
            {note.canEdit && (
              <button className={styles.action} type="button" onClick={() => onEdit(note)}>
                Изменить
              </button>
            )}
            {note.canDelete && (
              <button
                className={`${styles.action} ${styles.deleteAction}`}
                type="button"
                disabled={isDeleting}
                onClick={() => onDelete(note)}
              >
                {isDeleting ? 'Удаляем…' : 'Удалить'}
              </button>
            )}
          </div>
        )}
      </header>
      <p className={styles.body}>{note.body}</p>
    </article>
  );
}
