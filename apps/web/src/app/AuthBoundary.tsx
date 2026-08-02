import {Button} from '@gravity-ui/uikit';
import {Navigate, Outlet, useLocation} from 'react-router-dom';

import {useCurrentUser} from '../entities/session/api/me-query';
import {authHref} from '../shared/lib/navigation';
import {CenteredSurface} from '../shared/ui/centered-surface';
import {PageLoader} from './ui/PageLoader/PageLoader';
import styles from './AuthBoundary.module.css';

export function ProtectedRoute() {
  const location = useLocation();
  const me = useCurrentUser();
  if (me.isPending) return <RouteLoading />;
  if (me.data === null) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={authHref('/login', next)} />;
  }
  if (me.isError) return <RouteError onRetry={() => void me.refetch()} />;
  return <Outlet />;
}

export function GuestOnlyRoute() {
  const me = useCurrentUser();
  if (me.isPending) return <RouteLoading />;
  if (me.data) return <Navigate replace to="/campaigns" />;
  return <Outlet />;
}

export function RouteLoading() {
  return <PageLoader />;
}

export function RouteError({onRetry}: {onRetry?: () => void}) {
  return (
    <CenteredSurface>
      <h1>Связь потеряна</h1>
      <p className={styles.errorText}>Не удалось связаться с таверной. Проверьте соединение и повторите попытку.</p>
      {onRetry && <Button view="action" size="l" onClick={onRetry}>Повторить</Button>}
    </CenteredSurface>
  );
}
