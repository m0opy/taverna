import type {NpcDto, NpcRelationInput, NpcWriteRequest} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import type {FormEvent, KeyboardEvent} from 'react';
import {useState} from 'react';

import {useCreateNpc} from '../../../features/npc/create/model/use-create-npc';
import {useEditNpc} from '../../../features/npc/edit/model/use-edit-npc';
import {ApiError} from '../../../shared/api/client';
import {attitudeLabels} from '../../../entities/npc/model/presentation';
import {NpcRelationsField} from '../../npc-relations/ui/NpcRelationsField';
import styles from './NpcEditor.module.css';

interface NpcEditorProps {
  campaignId: string;
  items: NpcDto[];
  npc?: NpcDto | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function NpcEditor({campaignId, items, npc = null, onCancel, onSaved}: NpcEditorProps) {
  const [name, setName] = useState(npc?.name ?? '');
  const [title, setTitle] = useState(npc?.title ?? '');
  const [attitude, setAttitude] = useState<NpcWriteRequest['attitude']>(npc?.attitude ?? 'unknown');
  const [tags, setTags] = useState(npc?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState(npc?.notes ?? '');
  const [relations, setRelations] = useState<NpcRelationInput[]>(npc?.relations.map(({toNpc, label}) => ({toNpcId: toNpc.id, label})) ?? []);
  const createNpc = useCreateNpc(campaignId);
  const editNpc = useEditNpc(campaignId);
  const mutation = npc ? editNpc : createNpc;
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;

  const addTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag || tags.some((tag) => tag.toLocaleLowerCase() === nextTag.toLocaleLowerCase()) || tags.length >= 5) {
      setTagInput('');
      return;
    }
    setTags([...tags, nextTag]);
    setTagInput('');
  };

  const onTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload: NpcWriteRequest = {
      name,
      title,
      attitude,
      tags,
      notes,
      relations,
    };
    if (npc) {
      editNpc.mutate({npcId: npc.id, payload}, {onSuccess: onSaved});
    } else {
      createNpc.mutate(payload, {onSuccess: onSaved});
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section aria-labelledby="npc-editor-title" aria-modal="true" className={styles.dialog} role="dialog">
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{npc ? 'Редактирование' : 'Новая карточка'}</p>
            <h2 id="npc-editor-title">{npc ? 'Изменить NPC' : 'Добавить NPC'}</h2>
          </div>
          <button aria-label="Закрыть форму" className={styles.close} type="button" onClick={onCancel}>×</button>
        </header>

        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>
            <span>Имя</span>
            <input autoFocus required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
            {apiError?.fields?.name && <small>{apiError.fields.name}</small>}
          </label>
          <label className={styles.field}>
            <span>Титул или роль</span>
            <input maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="например, трактирщик" />
          </label>

          <fieldset className={styles.attitudes}>
            <legend>Отношение</legend>
            <div className={styles.attitudeOptions}>
              {Object.entries(attitudeLabels).map(([value, label]) => (
                <label className={attitude === value ? styles.selectedAttitude : styles.attitudeOption} key={value}>
                  <input
                    checked={attitude === value}
                    name="attitude"
                    type="radio"
                    value={value}
                    onChange={() => setAttitude(value as NpcWriteRequest['attitude'])}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label htmlFor="npc-tag-input">Теги · {tags.length}/5</label>
            <div className={styles.tagInput}>
              <div className={styles.tagList}>
                {tags.map((tag) => (
                  <span className={styles.tag} key={tag}>
                    {tag}
                    <button aria-label={`Удалить тег ${tag}`} type="button" onClick={() => setTags(tags.filter((item) => item !== tag))}>×</button>
                  </span>
                ))}
              </div>
              <input
                id="npc-tag-input"
                disabled={tags.length >= 5}
                maxLength={24}
                placeholder={tags.length >= 5 ? 'Лимит тегов достигнут' : 'Введите тег и нажмите Enter'}
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={onTagKeyDown}
                onBlur={addTag}
              />
            </div>
            {apiError?.fields?.tags && <small>{apiError.fields.tags}</small>}
          </div>

          <label className={styles.field}>
            <span>Заметки</span>
            <textarea maxLength={1000} rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Что важно помнить об этом персонаже?" />
            <small className={styles.counter}>{notes.length}/1000</small>
          </label>

          <NpcRelationsField items={items} relations={relations} onChange={setRelations} {...(npc ? {currentNpcId: npc.id} : {})} />

          {apiError && !apiError.fields && <p className={styles.error} role="alert">{apiError.message}</p>}
          <footer className={styles.actions}>
            <Button disabled={mutation.isPending} loading={mutation.isPending} size="l" type="submit" view="action">
              {npc ? 'Сохранить' : 'Создать NPC'}
            </Button>
            <Button disabled={mutation.isPending} size="l" type="button" view="outlined" onClick={onCancel}>Отмена</Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
