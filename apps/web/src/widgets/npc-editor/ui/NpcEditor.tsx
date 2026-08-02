import {
  hasDuplicateNpcRelationTargets,
  type NpcDto,
  type NpcRelationInput,
  type NpcWriteRequest,
} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import type {FormEvent, KeyboardEvent as ReactKeyboardEvent} from 'react';
import {useEffect, useId, useRef, useState} from 'react';

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
  const dialogRef = useRef<HTMLElement | null>(null);
  const [name, setName] = useState(npc?.name ?? '');
  const [title, setTitle] = useState(npc?.title ?? '');
  const [attitude, setAttitude] = useState<NpcWriteRequest['attitude']>(npc?.attitude ?? 'unknown');
  const [tags, setTags] = useState(npc?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [notes, setNotes] = useState(npc?.notes ?? '');
  const [relations, setRelations] = useState<NpcRelationInput[]>(npc?.relations.map(({toNpc, label}) => ({toNpcId: toNpc.id, label})) ?? []);
  const tagErrorId = useId();
  const relationErrorId = useId();
  const createNpc = useCreateNpc(campaignId);
  const editNpc = useEditNpc(campaignId);
  const mutation = npc ? editNpc : createNpc;
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const isPending = mutation.isPending;
  const hasDuplicateRelations = hasDuplicateNpcRelationTargets(relations);
  const relationError = hasDuplicateRelations ? 'Нельзя добавить связь с одним NPC дважды.' : apiError?.fields?.relations;
  const genericError = mutation.error
    ? apiError && !apiError.fields
      ? apiError.message
      : !apiError
        ? 'Не удалось сохранить NPC. Проверьте соединение и попробуйте ещё раз.'
        : null
    : null;

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        onCancel();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusable = [...dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )].filter((element) => !element.hasAttribute('disabled') && element.tabIndex >= 0);

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (!activeElement || !dialog.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousActiveElement?.focus();
    };
  }, [isPending, onCancel]);

  const addTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) {
      setTagError(null);
      return;
    }

    if (nextTag.length > 24) {
      setTagError('Тег не должен быть длиннее 24 символов.');
      return;
    }

    if (tags.some((tag) => tag.toLocaleLowerCase() === nextTag.toLocaleLowerCase())) {
      setTagError('Такой тег уже добавлен.');
      return;
    }

    if (tags.length >= 5) {
      setTagError('Можно добавить не больше пяти тегов.');
      return;
    }

    setTags([...tags, nextTag]);
    setTagInput('');
    setTagError(null);
  };

  const onTagKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (hasDuplicateRelations) {
      return;
    }

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
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && !isPending && onCancel()}>
      <section aria-labelledby="npc-editor-title" aria-modal="true" className={styles.dialog} ref={dialogRef} role="dialog" tabIndex={-1}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{npc ? 'Редактирование' : 'Новая карточка'}</p>
            <h2 id="npc-editor-title">{npc ? 'Изменить NPC' : 'Добавить NPC'}</h2>
          </div>
          <button aria-label="Закрыть форму" className={styles.close} disabled={isPending} type="button" onClick={onCancel}>×</button>
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
                aria-describedby={tagError || apiError?.fields?.tags ? tagErrorId : undefined}
                aria-invalid={Boolean(tagError || apiError?.fields?.tags)}
                id="npc-tag-input"
                disabled={tags.length >= 5}
                maxLength={24}
                placeholder={tags.length >= 5 ? 'Лимит тегов достигнут' : 'Введите тег и нажмите Enter'}
                value={tagInput}
                onChange={(event) => {
                  setTagInput(event.target.value);
                  if (tagError) {
                    setTagError(null);
                  }
                }}
                onKeyDown={onTagKeyDown}
                onBlur={addTag}
              />
            </div>
            {(tagError || apiError?.fields?.tags) && (
              <small id={tagErrorId} role="alert">
                {tagError ?? apiError?.fields?.tags}
              </small>
            )}
          </div>

          <label className={styles.field}>
            <span>Заметки</span>
            <textarea maxLength={1000} rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Что важно помнить об этом персонаже?" />
            <small className={styles.counter}>{notes.length}/1000</small>
          </label>

          <NpcRelationsField
            errorId={relationError ? relationErrorId : undefined}
            errorMessage={relationError}
            items={items}
            relations={relations}
            onChange={setRelations}
            {...(npc ? {currentNpcId: npc.id} : {})}
          />

          {genericError && <p className={styles.error} role="alert">{genericError}</p>}
          <footer className={styles.actions}>
            <Button disabled={isPending} loading={isPending} size="l" type="submit" view="action">
              {npc ? 'Сохранить' : 'Создать NPC'}
            </Button>
            <Button disabled={isPending} size="l" type="button" view="outlined" onClick={onCancel}>Отмена</Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
