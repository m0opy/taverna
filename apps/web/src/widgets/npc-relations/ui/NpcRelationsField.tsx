import {hasDuplicateNpcRelationTargets, type NpcDto, type NpcRelationInput} from '@taverna/contracts';

import styles from './NpcRelationsField.module.css';

interface NpcRelationsFieldProps {
  currentNpcId?: string;
  errorId?: string | undefined;
  errorMessage?: string | undefined;
  items: NpcDto[];
  relations: NpcRelationInput[];
  onChange: (relations: NpcRelationInput[]) => void;
}

export function NpcRelationsField({currentNpcId, errorId, errorMessage, items, relations, onChange}: NpcRelationsFieldProps) {
  const available = items.filter((npc) => npc.id !== currentNpcId);
  const maxRelations = Math.min(5, available.length);
  const hasDuplicateTargets = hasDuplicateNpcRelationTargets(relations);
  const resolvedErrorMessage = errorMessage ?? (hasDuplicateTargets ? 'Нельзя добавить связь с одним NPC дважды.' : undefined);
  const describedBy = resolvedErrorMessage ? errorId : undefined;

  const updateRelation = (index: number, patch: Partial<NpcRelationInput>) => {
    onChange(relations.map((relation, relationIndex) => relationIndex === index ? {...relation, ...patch} : relation));
  };

  const isTargetUsedElsewhere = (targetId: string, currentIndex: number) => relations.some(
    (relation, relationIndex) => relationIndex !== currentIndex && relation.toNpcId === targetId,
  );

  return (
    <fieldset aria-describedby={describedBy} className={styles.fieldset}>
      <legend>Связи · {relations.length}/{maxRelations}</legend>
      {relations.map((relation, index) => (
        <div className={styles.row} key={`${relation.toNpcId}-${index}`}>
          <label className={styles.control}>
            <span className={styles.visuallyHidden}>Связанный NPC</span>
            <select
              aria-describedby={describedBy}
              aria-invalid={Boolean(resolvedErrorMessage)}
              required
              value={relation.toNpcId}
              onChange={(event) => updateRelation(index, {toNpcId: event.target.value})}
            >
              <option value="">Выберите NPC</option>
              {available.map((npc) => (
                <option disabled={isTargetUsedElsewhere(npc.id, index)} key={npc.id} value={npc.id}>
                  {npc.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.control}>
            <span className={styles.visuallyHidden}>Описание связи</span>
            <input
              aria-describedby={describedBy}
              aria-invalid={Boolean(resolvedErrorMessage)}
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
      {resolvedErrorMessage && (
        <p className={styles.fieldError} id={errorId} role="alert">
          {resolvedErrorMessage}
        </p>
      )}
      <button
        className={styles.add}
        disabled={hasDuplicateTargets || relations.length >= maxRelations || available.length === 0}
        type="button"
        onClick={() => onChange([...relations, {toNpcId: '', label: ''}])}
      >
        + Добавить связь
      </button>
    </fieldset>
  );
}
