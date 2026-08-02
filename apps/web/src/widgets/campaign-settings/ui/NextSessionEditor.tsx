import {useEffect, useRef, useState} from 'react';

import {useUpdateCampaign} from '../../../features/campaign/update/model/use-update-campaign';
import {ApiError} from '../../../shared/api/client';
import styles from './NextSessionEditor.module.css';

interface NextSessionEditorProps {
  campaignId: string;
  nextSessionAt: string | null;
  onClose?: () => void;
}

function todayValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function NextSessionEditor({campaignId, nextSessionAt, onClose}: NextSessionEditorProps) {
  const [value, setValue] = useState(nextSessionAt ?? '');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const update = useUpdateCampaign(campaignId);
  const error = update.error instanceof ApiError ? update.error : null;
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const minDate = todayValue();
  const localError = value && value < minDate ? 'Выберите сегодняшнюю или будущую дату.' : null;

  useEffect(() => {
    setValue(nextSessionAt ?? '');
    setSuccessMessage(null);
  }, [nextSessionAt]);

  useEffect(() => {
    if (!onClose) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !update.isPending) onClose();
      if (event.key !== 'Tab') return;

      const focusable = sectionRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, update.isPending]);

  const save = () => {
    if (localError) return;
    const payload = {nextSessionAt: value || null};
    if (onClose) {
      update.mutate(payload, {onSuccess: () => { setSuccessMessage('Дата следующей игры сохранена.'); onClose(); }});
    } else {
      update.mutate(payload, {onSuccess: () => setSuccessMessage('Дата следующей игры сохранена.')});
    }
  };

  return (
    <section aria-labelledby="next-session-title" aria-modal={Boolean(onClose)} className={onClose ? styles.modal : styles.inline} ref={sectionRef} role={onClose ? 'dialog' : undefined}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Расписание</p>
          <h2 id="next-session-title">Следующая игра</h2>
        </div>
        {onClose && <button aria-label="Закрыть" className={styles.close} disabled={update.isPending} type="button" onClick={onClose}>×</button>}
      </div>
      <label className={styles.field}>
        <span>Дата игры</span>
        <input autoFocus={Boolean(onClose)} disabled={update.isPending} min={minDate} ref={inputRef} type="date" value={value} onChange={(event) => { setSuccessMessage(null); setValue(event.target.value); }} />
      </label>
      {successMessage && !onClose && <p className={styles.success} role="status">{successMessage}</p>}
      {(localError || error) && <p className={styles.error} role="alert">{localError ?? error?.fields?.nextSessionAt ?? error?.message}</p>}
      <footer className={styles.actions}>
        <button className={styles.save} disabled={update.isPending} type="button" onClick={save}>{update.isPending ? 'Сохраняем…' : 'Сохранить'}</button>
        {nextSessionAt && <button className={styles.clear} disabled={update.isPending} type="button" onClick={() => {
          if (onClose) {
            update.mutate({nextSessionAt: null}, {onSuccess: () => { setSuccessMessage('Дата следующей игры очищена.'); onClose(); }});
          } else {
            update.mutate({nextSessionAt: null}, {onSuccess: () => setSuccessMessage('Дата следующей игры очищена.')});
          }
        }}>Очистить дату</button>}
      </footer>
    </section>
  );
}
