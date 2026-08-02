import {Button} from '@gravity-ui/uikit';

import {useDocumentTitle} from '../shared/lib/use-document-title';
import {CenteredSurface} from '../shared/ui/centered-surface';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  useDocumentTitle('Страница не найдена');
  const actionProps = styles.primaryAction ? {className: styles.primaryAction} : {};

  return (
    <CenteredSurface>
      <p className="eyebrow">404</p>
      <h1>Тропа затерялась</h1>
      <p>Такой страницы в хрониках нет.</p>
      <Button {...actionProps} view="action" href="/">
        Вернуться в таверну
      </Button>
    </CenteredSurface>
  );
}

export default NotFoundPage;
