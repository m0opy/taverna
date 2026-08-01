import {Navigate, Outlet, useLocation} from 'react-router-dom';

import {useCurrentUser} from '../entities/session/api/me-query';
import {ApiError} from '../shared/api/client';
import {authHref} from '../shared/lib/navigation';
import {CenteredSurface} from '../shared/ui/centered-surface';
import styles from './AuthBoundary.module.css';

export function ProtectedRoute() {
  const location = useLocation();
  const me = useCurrentUser();
  if (me.isPending) return <RouteLoading />;
  if (me.error instanceof ApiError && me.error.status === 401) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={authHref('/login', next)} />;
  }
  if (me.isError) return <RouteError />;
  return <Outlet />;
}

export function GuestOnlyRoute() {
  const me = useCurrentUser();
  if (me.isPending) return <RouteLoading />;
  if (me.data) return <Navigate replace to="/campaigns" />;
  return <Outlet />;
}

export function RouteLoading() {
  return <main className={styles.routeLoading}><p className={styles.statusMessage}>Разжигаем огонь…</p></main>;
}

export function RouteError() {
  return <CenteredSurface><h1>Связь потеряна</h1><p className={styles.errorText}>Не удалось связаться с таверной. Обновите страницу и попробуйте снова.</p></CenteredSurface>;
}
