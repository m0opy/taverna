import type {CreateGameRequest, GameDto, UpdateGameRequest} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import type {FormEvent} from 'react';
import {useEffect, useId, useRef, useState} from 'react';

import {useCreateGame} from '../../../features/game/create/model/use-create-game';
import {useUpdateGame} from '../../../features/game/update/model/use-update-game';
import {ApiError} from '../../../shared/api/client';
import styles from './GameEditor.module.css';

interface GameEditorProps {
  campaignId: string;
  defaultDate: string;
  game?: GameDto | null;
  onCancel: () => void;
  onSaved: (game: GameDto) => void;
}

export function GameEditor({campaignId, defaultDate, game = null, onCancel, onSaved}: GameEditorProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const [scheduledFor, setScheduledFor] = useState(game?.scheduledFor ?? defaultDate);
  const [scheduledTime, setScheduledTime] = useState(game?.scheduledTime ?? '');
  const [description, setDescription] = useState(game?.description ?? '');
  const createGame = useCreateGame(campaignId);
  const updateGame = useUpdateGame(campaignId);
  const mutation = game ? updateGame : createGame;
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const isPending = mutation.isPending;
  const genericError = mutation.error && (!apiError || !apiError.fields) ? 'Не удалось сохранить игру. Проверьте соединение и попробуйте ещё раз.' : null;

  useEffect(() => {
    setScheduledFor(game?.scheduledFor ?? defaultDate);
    setScheduledTime(game?.scheduledTime ?? '');
    setDescription(game?.description ?? '');
  }, [defaultDate, game]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        onCancel();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [])].filter((element) => element.tabIndex >= 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isPending, onCancel]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      scheduledFor,
      scheduledTime: scheduledTime || null,
      title: game?.title ?? 'Игра',
      description,
    };
    if (game) {
      updateGame.mutate({gameId: game.id, payload: payload satisfies UpdateGameRequest}, {onSuccess: onSaved});
    } else {
      createGame.mutate(payload satisfies CreateGameRequest, {onSuccess: onSaved});
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && !isPending && onCancel()}>
      <section aria-labelledby={titleId} aria-modal="true" className={styles.dialog} ref={dialogRef} role="dialog" tabIndex={-1}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{game ? 'Расписание' : 'Новая игра'}</p>
            <h2 id={titleId}>{game ? 'Изменить игру' : 'Запланировать игру'}</h2>
          </div>
          <button aria-label="Закрыть форму игры" className={styles.close} disabled={isPending} type="button" onClick={onCancel}>×</button>
        </header>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.dateFields}>
            <label className={styles.field}>
              <span>Дата игры</span>
              <input aria-invalid={Boolean(apiError?.fields?.scheduledFor)} autoFocus disabled={isPending} required type="date" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
              {apiError?.fields?.scheduledFor && <small role="alert">{apiError.fields.scheduledFor}</small>}
            </label>
            <label className={styles.field}>
              <span>Время <em>(необязательно)</em></span>
              <input aria-invalid={Boolean(apiError?.fields?.scheduledTime)} disabled={isPending} type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} />
              {apiError?.fields?.scheduledTime && <small role="alert">{apiError.fields.scheduledTime}</small>}
            </label>
          </div>
          <label className={styles.field}>
            <span>Что подготовить к сессии <em>(необязательно)</em></span>
            <textarea disabled={isPending} maxLength={500} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Например, подготовить карты и список слухов" />
            <small className={styles.counter}>{description.length}/500</small>
          </label>
          {genericError && <p className={styles.error} role="alert">{genericError}</p>}
          <footer className={styles.actions}>
            <Button disabled={isPending} loading={isPending} size="l" type="submit" view="action">{game ? 'Сохранить' : 'Запланировать'}</Button>
            <Button disabled={isPending} size="l" type="button" view="outlined" onClick={onCancel}>Отмена</Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
