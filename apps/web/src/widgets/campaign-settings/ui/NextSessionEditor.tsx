import {useEffect, useState} from 'react';

import {useUpdateCampaign} from '../../../features/campaign/update/model/use-update-campaign';
import {ApiError} from '../../../shared/api/client';
import styles from './NextSessionEditor.module.css';

interface NextSessionEditorProps {
  campaignId: string;
  nextSessionAt: string | null;
  onClose?: () => void;
}

export function NextSessionEditor({campaignId, nextSessionAt, onClose}: NextSessionEditorProps) {
  const [value, setValue] = useState(nextSessionAt ?? '');
  const update = useUpdateCampaign(campaignId);
  const error = update.error instanceof ApiError ? update.error : null;

  useEffect(() => setValue(nextSessionAt ?? ''), [nextSessionAt]);

  const save = () => {
    const payload = {nextSessionAt: value || null};
    if (onClose) {
      update.mutate(payload, {onSuccess: onClose});
    } else {
      update.mutate(payload);
    }
  };

  return (
    <section aria-labelledby="next-session-title" aria-modal={Boolean(onClose)} className={onClose ? styles.modal : styles.inline} role={onClose ? 'dialog' : undefined}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Расписание</p>
          <h2 id="next-session-title">Следующая игра</h2>
        </div>
        {onClose && <button aria-label="Закрыть" className={styles.close} disabled={update.isPending} type="button" onClick={onClose}>×</button>}
      </div>
      <label className={styles.field}>
        <span>Дата</span>
        <input disabled={update.isPending} type="date" value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      {error && <p className={styles.error} role="alert">{error.fields?.nextSessionAt ?? error.message}</p>}
      <footer className={styles.actions}>
        <button className={styles.save} disabled={update.isPending} type="button" onClick={save}>{update.isPending ? 'Сохраняем…' : 'Сохранить'}</button>
        {nextSessionAt && <button className={styles.clear} disabled={update.isPending} type="button" onClick={() => {
          if (onClose) {
            update.mutate({nextSessionAt: null}, {onSuccess: onClose});
          } else {
            update.mutate({nextSessionAt: null});
          }
        }}>Очистить дату</button>}
      </footer>
    </section>
  );
}
