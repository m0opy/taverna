import type {NpcDto} from '@taverna/contracts';
import {PencilToSquare, TrashBin} from '@gravity-ui/icons';
import {useState} from 'react';

import {attitudeLabels, attitudeTone, npcInitials} from '../model/presentation';
import styles from './NpcCard.module.css';

interface NpcCardProps {
  isDeleting: boolean;
  npc: NpcDto;
  onDelete: (npc: NpcDto) => void;
  onEdit: (npc: NpcDto) => void;
}

export function NpcCard({isDeleting, npc, onDelete, onEdit}: NpcCardProps) {
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const hasNotes = npc.notes.trim().length > 0;
  const hasLongNotes = npc.notes.length > 220 || npc.notes.split(/\r?\n/).length > 3;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.initials} aria-hidden="true">{npcInitials(npc.name)}</span>
        <div className={styles.identity}>
          <h2>{npc.name}</h2>
          {npc.title && <p>{npc.title}</p>}
        </div>
        <span className={`${styles.attitude} ${styles[attitudeTone[npc.attitude]]}`}>{attitudeLabels[npc.attitude]}</span>
      </div>

      {npc.tags.length > 0 && (
        <div className={styles.tags} aria-label={`Теги NPC ${npc.name}`}>
          {npc.tags.map((tag) => <span className={styles.tag} key={tag}>{tag}</span>)}
        </div>
      )}

      {hasNotes && (
        <div className={styles.notesBlock}>
          <p className={`${styles.notes} ${hasLongNotes && !isNotesExpanded ? styles.notesCollapsed : ''}`}>{npc.notes}</p>
          {hasLongNotes && (
            <button
              aria-expanded={isNotesExpanded}
              className={styles.notesToggle}
              type="button"
              onClick={() => setIsNotesExpanded((expanded) => !expanded)}
            >
              {isNotesExpanded ? 'Свернуть заметки' : 'Показать полностью'}
            </button>
          )}
        </div>
      )}

      <div className={styles.relations}>
        <span className={styles.relationsLabel}>Связи</span>
        {npc.relations.length > 0 ? (
          npc.relations.map((relation) => (
            <span className={styles.relation} key={relation.id}>
              <b>{relation.toNpc.name}</b> · {relation.label}
            </span>
          ))
        ) : (
          <span className={styles.noRelations}>Без связей</span>
        )}
      </div>

      <footer className={styles.footer}>
        <span className={styles.author}>Создал(а): {npc.createdBy.userName}</span>
        <div className={styles.actions}>
          <button aria-label="Изменить NPC" title="Изменить NPC" type="button" onClick={() => onEdit(npc)}>
            <PencilToSquare aria-hidden="true" />
          </button>
          <button aria-label={isDeleting ? 'Удаление NPC' : 'Удалить NPC'} disabled={isDeleting} title="Удалить NPC" type="button" onClick={() => onDelete(npc)}>
            <TrashBin aria-hidden="true" />
          </button>
        </div>
      </footer>
    </article>
  );
}
