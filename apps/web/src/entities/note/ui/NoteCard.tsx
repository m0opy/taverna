import type {NoteDto} from '@taverna/contracts';
import {ChevronDown, PencilToSquare, TrashBin} from '@gravity-ui/icons';
import {useState} from 'react';

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
  const isCollapsible = note.body.length > 360;
  const [isExpanded, setIsExpanded] = useState(false);

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
              <button aria-label="Изменить заметку" className={styles.action} title="Изменить заметку" type="button" onClick={() => onEdit(note)}>
                <PencilToSquare aria-hidden="true" />
              </button>
            )}
            {note.canDelete && (
              <button
                aria-label={isDeleting ? 'Удаление заметки' : 'Удалить заметку'}
                className={`${styles.action} ${styles.deleteAction}`}
                type="button"
                title="Удалить заметку"
                disabled={isDeleting}
                onClick={() => onDelete(note)}
              >
                <TrashBin aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </header>
      <div className={`${styles.bodyWrap} ${isCollapsible && isExpanded ? styles.bodyExpanded : ''}`}>
        <p className={`${styles.body} ${isCollapsible && !isExpanded ? styles.bodyCollapsed : ''}`} id={`note-body-${note.id}`}>{note.body}</p>
        {isCollapsible && (
          <button
            aria-controls={`note-body-${note.id}`}
            aria-expanded={isExpanded}
            className={styles.expandButton}
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            <span>{isExpanded ? 'Свернуть заметку' : 'Показать полностью'}</span>
            <ChevronDown aria-hidden="true" className={styles.expandIcon} />
          </button>
        )}
      </div>
    </article>
  );
}
