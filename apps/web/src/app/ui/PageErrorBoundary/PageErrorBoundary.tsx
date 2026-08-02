import {Component, type ReactNode} from 'react';
import {Button} from '@gravity-ui/uikit';

import {ApiError} from '../../../shared/api/client';
import {buildDocumentTitle} from '../../../shared/lib/title';
import styles from './PageErrorBoundary.module.css';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pathname: string;
}

interface PageErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  public override state: PageErrorBoundaryState = {hasError: false, error: null};

  public static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return {hasError: true, error};
  }

  public override componentDidCatch(error: Error) {
    document.title = error instanceof ApiError && error.status === 403
      ? buildDocumentTitle('Нет доступа к разделу')
      : buildDocumentTitle('Страница недоступна');
  }

  private handleRetry = () => {
    window.location.reload();
  };

  private handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign(this.getFallbackHref());
  };

  private getFallbackHref() {
    return this.props.pathname.startsWith('/c/') || this.props.pathname.startsWith('/campaigns') ? '/campaigns' : '/';
  }

  public override render() {
    if (this.state.hasError) {
      const {error} = this.state;
      const isForbidden = error instanceof ApiError && error.status === 403;
      const fallbackHref = this.getFallbackHref();

      return (
        <main className={styles.fallback} role="alert">
          <p className={styles.eyebrow}>{isForbidden ? '403' : 'Ошибка загрузки'}</p>
          <h1>{isForbidden ? 'Нет доступа к разделу' : 'Страница не открылась'}</h1>
          <p>
            {isForbidden
              ? 'Этот раздел доступен только участникам с подходящими правами. Вернитесь назад или откройте доступный раздел.'
              : 'Не удалось загрузить этот раздел. Обновите страницу или вернитесь к списку кампаний.'}
          </p>
          <div className={styles.actions}>
            {isForbidden ? (
              <>
                <Button view="action" onClick={this.handleBack}>Вернуться назад</Button>
                <Button view="outlined" href={fallbackHref}>
                  {fallbackHref === '/campaigns' ? 'К кампаниям' : 'На главную'}
                </Button>
              </>
            ) : (
              <>
                <Button view="action" size="l" onClick={this.handleRetry}>Повторить</Button>
                <Button view="outlined" href={fallbackHref}>
                  {fallbackHref === '/campaigns' ? 'К кампаниям' : 'На главную'}
                </Button>
              </>
            )}
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
