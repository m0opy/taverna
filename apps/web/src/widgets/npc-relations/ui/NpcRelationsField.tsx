import type {NpcDto, NpcRelationInput} from '@taverna/contracts';

import styles from './NpcRelationsField.module.css';

interface NpcRelationsFieldProps {
  currentNpcId?: string;
  items: NpcDto[];
  relations: NpcRelationInput[];
  onChange: (relations: NpcRelationInput[]) => void;
}

export function NpcRelationsField({currentNpcId, items, relations, onChange}: NpcRelationsFieldProps) {
  const available = items.filter((npc) => npc.id !== currentNpcId);

  const updateRelation = (index: number, patch: Partial<NpcRelationInput>) => {
    onChange(relations.map((relation, relationIndex) => relationIndex === index ? {...relation, ...patch} : relation));
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend>Связи · {relations.length}/5</legend>
      {relations.map((relation, index) => (
        <div className={styles.row} key={`${relation.toNpcId}-${index}`}>
          <label className={styles.control}>
            <span className={styles.visuallyHidden}>Связанный NPC</span>
            <select
              required
              value={relation.toNpcId}
              onChange={(event) => updateRelation(index, {toNpcId: event.target.value})}
            >
              <option value="">Выберите NPC</option>
              {available.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
            </select>
          </label>
          <label className={styles.control}>
            <span className={styles.visuallyHidden}>Описание связи</span>
            <input
              required
              maxLength={60}
              placeholder="например, должен денег"
              value={relation.label}
              onChange={(event) => updateRelation(index, {label: event.target.value})}
            />
          </label>
          <button aria-label="Удалить связь" type="button" onClick={() => onChange(relations.filter((_, relationIndex) => relationIndex !== index))}>×</button>
        </div>
      ))}
      <button
        className={styles.add}
        disabled={relations.length >= 5 || available.length === 0}
        type="button"
        onClick={() => onChange([...relations, {toNpcId: '', label: ''}])}
      >
        + Добавить связь
      </button>
    </fieldset>
  );
}
