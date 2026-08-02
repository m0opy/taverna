import {useEffect} from 'react';

import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  isPending?: boolean;
  pendingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmDialog({
  cancelLabel = 'Отмена',
  confirmLabel = 'Удалить',
  description,
  isPending = false,
  pendingLabel = 'Удаляем…',
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPending, onCancel]);

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && !isPending && onCancel()}>
      <section aria-describedby="confirm-dialog-description" aria-labelledby="confirm-dialog-title" aria-modal="true" className={styles.dialog} role="dialog">
        <p className={styles.eyebrow}>Подтвердите действие</p>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p className={styles.description} id="confirm-dialog-description">{description}</p>
        <footer className={styles.actions}>
          <button autoFocus className={styles.cancel} disabled={isPending} type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className={styles.confirm} disabled={isPending} type="button" onClick={onConfirm}>
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
