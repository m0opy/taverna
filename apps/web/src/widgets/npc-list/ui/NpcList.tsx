import type {NpcDto} from '@taverna/contracts';

import {NpcCard} from '../../../entities/npc/ui/NpcCard';
import styles from './NpcList.module.css';

interface NpcListProps {
  availableTags: string[];
  deletingNpcId?: string;
  items: NpcDto[];
  selectedTag?: string;
  onCreate: () => void;
  onDelete: (npc: NpcDto) => void;
  onEdit: (npc: NpcDto) => void;
  onTagChange: (tag?: string) => void;
}

export function NpcList({availableTags, deletingNpcId, items, selectedTag, onCreate, onDelete, onEdit, onTagChange}: NpcListProps) {
  return (
    <>
      {(items.length > 0 || availableTags.length > 0) && (
        <nav className={styles.filters} aria-label="Фильтр NPC по тегам">
          <button aria-pressed={!selectedTag} className={!selectedTag ? styles.selectedFilter : styles.filter} type="button" onClick={() => onTagChange()}>
            Все
          </button>
          {availableTags.map((tag) => (
            <button
              aria-pressed={selectedTag?.toLocaleLowerCase() === tag.toLocaleLowerCase()}
              className={selectedTag?.toLocaleLowerCase() === tag.toLocaleLowerCase() ? styles.selectedFilter : styles.filter}
              key={tag}
              type="button"
              onClick={() => onTagChange(tag)}
            >
              {tag}
            </button>
          ))}
        </nav>
      )}

      {items.length === 0 ? (
        <section className={styles.emptyState}>
          <div className={styles.emptySigil} aria-hidden="true">♧</div>
          <h2>{selectedTag ? 'По этому тегу NPC не найдены' : 'Здесь появятся NPC'}</h2>
          <p>{selectedTag ? 'Выберите другой тег или добавьте новую карточку.' : 'Записывайте, кого встретила партия, — потом не вспомните.'}</p>
          <button className={styles.primaryAction} type="button" onClick={onCreate}>Добавить NPC</button>
        </section>
      ) : (
        <div className={styles.grid} aria-label="NPC кампании">
          {items.map((npc) => <NpcCard isDeleting={deletingNpcId === npc.id} key={npc.id} npc={npc} onDelete={onDelete} onEdit={onEdit} />)}
        </div>
      )}
    </>
  );
}
