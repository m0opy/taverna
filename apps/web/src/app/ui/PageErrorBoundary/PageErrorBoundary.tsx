import {Component, type ReactNode} from 'react';
import {Button} from '@gravity-ui/uikit';

import styles from './PageErrorBoundary.module.css';

interface PageErrorBoundaryProps {
  children: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  public override state: PageErrorBoundaryState = {hasError: false};

  public static getDerivedStateFromError(): PageErrorBoundaryState {
    return {hasError: true};
  }

  private handleRetry = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <main className={styles.fallback} role="alert">
          <p className={styles.eyebrow}>Ошибка загрузки</p>
          <h1>Страница не открылась</h1>
          <p>Не удалось загрузить этот раздел. Обновите страницу или вернитесь к списку кампаний.</p>
          <div className={styles.actions}>
            <Button view="action" onClick={this.handleRetry}>Повторить</Button>
            <Button view="outlined" href="/campaigns">К кампаниям</Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
