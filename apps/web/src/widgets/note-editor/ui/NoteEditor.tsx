import type {NoteDto, NoteWriteRequest} from '@taverna/contracts';
import {ChevronDown, ChevronUp} from '@gravity-ui/icons';
import {Button} from '@gravity-ui/uikit';
import type {FormEvent} from 'react';
import {useState} from 'react';

import {useCreateNote} from '../../../features/note/create/model/use-create-note';
import {useEditNote} from '../../../features/note/edit/model/use-edit-note';
import {ApiError} from '../../../shared/api/client';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  campaignId: string;
  note?: NoteDto | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function NoteEditor({campaignId, note = null, onCancel, onSaved}: NoteEditorProps) {
  const initialBody = note?.body ?? '';
  const initialSessionDate = note?.sessionDate ?? '';
  const initialHasSessionDate = Boolean(note?.sessionDate);
  const [body, setBody] = useState(initialBody);
  const [sessionDate, setSessionDate] = useState(initialSessionDate);
  const [hasSessionDate, setHasSessionDate] = useState(initialHasSessionDate);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const createNote = useCreateNote(campaignId);
  const editNote = useEditNote(campaignId);
  const mutation = note ? editNote : createNote;
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const isPending = mutation.isPending;
  const bodyError = apiError?.fields?.body;
  const sessionDateError = apiError?.fields?.sessionDate;
  const isDirty = body !== initialBody || sessionDate !== initialSessionDate || hasSessionDate !== initialHasSessionDate;
  const hasDraft = body.trim().length > 0 || (hasSessionDate && sessionDate.length > 0);
  const formError = mutation.error
    ? apiError?.fields
      ? null
      : apiError?.message ?? 'Не удалось сохранить заметку. Проверьте соединение и попробуйте ещё раз.'
    : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload: NoteWriteRequest = {
      body,
      sessionDate: hasSessionDate && sessionDate ? sessionDate : null,
    };

    if (note) {
      editNote.mutate({noteId: note.id, payload}, {onSuccess: onSaved});
    } else {
      createNote.mutate(payload, {onSuccess: onSaved});
    }
  };

  const cancel = () => {
    if (
      isDirty &&
      hasDraft &&
      typeof window !== 'undefined' &&
      !window.confirm('Закрыть редактор и потерять несохранённые изменения?')
    ) {
      return;
    }

    onCancel();
  };

  return (
    <form className={`${styles.form} ${isCollapsed ? styles.collapsed : ''}`} onSubmit={submit}>
      <div className={styles.formHeading}>
        <div>
          <p className={styles.eyebrow}>{note ? 'Редактирование' : 'Новая запись'}</p>
          <h2>{note ? 'Изменить заметку' : 'Написать заметку'}</h2>
        </div>
        <div className={styles.headingActions}>
          <span className={styles.counter}>{body.length}/5000</span>
          <button
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Развернуть редактор заметки' : 'Свернуть редактор заметки'}
            className={styles.collapseButton}
            title={isCollapsed ? 'Развернуть редактор' : 'Свернуть редактор'}
            type="button"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          >
            {isCollapsed ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isCollapsed ? (
        <p className={styles.collapsedHint}>Редактор скрыт — текст заметки сохранится, пока вы его не опубликуете.</p>
      ) : <>
        <label className={styles.field}>
        <span>Текст заметки</span>
        <textarea
          autoFocus
          required
          aria-describedby={bodyError ? 'note-body-error' : undefined}
          aria-invalid={Boolean(bodyError)}
          minLength={1}
          maxLength={5000}
          rows={8}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Что произошло на сессии?"
        />
        {bodyError && <small className={styles.fieldError} id="note-body-error" role="alert">{bodyError}</small>}
        </label>

        <label className={styles.checkbox}>
        <input
          checked={hasSessionDate}
          type="checkbox"
          onChange={(event) => setHasSessionDate(event.target.checked)}
        />
        <span>Привязать к сессии</span>
        </label>

        {hasSessionDate && (
          <label className={styles.field}>
          <span>Дата сессии</span>
          <input
            aria-describedby={sessionDateError ? 'note-session-date-error' : undefined}
            aria-invalid={Boolean(sessionDateError)}
            required
            type="date"
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            onInput={(event) => setSessionDate(event.currentTarget.value)}
          />
          {sessionDateError && <small className={styles.fieldError} id="note-session-date-error" role="alert">{sessionDateError}</small>}
          </label>
        )}

        {formError && <p className={styles.formError} role="alert">{formError}</p>}
        <div className={styles.actions}>
        <Button disabled={isPending} loading={isPending} type="submit" view="action" size="l">
          {note ? 'Сохранить' : 'Опубликовать'}
        </Button>
        <Button disabled={isPending} type="button" view="outlined" size="l" onClick={cancel}>
          Отмена
        </Button>
        </div>
      </>}
    </form>
  );
}
