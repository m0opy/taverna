import {Loader} from '@gravity-ui/uikit';

import styles from './PageLoader.module.css';

export function PageLoader() {
  return (
    <main className={styles.loader} aria-live="polite" aria-busy="true">
      <Loader size="l" />
      <span>Загружаем страницу…</span>
    </main>
  );
}
