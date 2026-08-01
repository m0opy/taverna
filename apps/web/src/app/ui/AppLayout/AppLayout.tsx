import {Button, ThemeProvider} from '@gravity-ui/uikit';
import {Link, Outlet} from 'react-router-dom';

import {useCurrentUser} from '../../../entities/session/api/me-query';
import {useLogout} from '../../../features/auth/logout/model/use-logout';
import {PageBoundary} from '../PageBoundary/PageBoundary';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const me = useCurrentUser();
  const logout = useLogout();

  return (
    <div className={styles.frame}>
      <ThemeProvider scoped theme="dark">
        <header className={styles.header}>
          <Link className={styles.brand} to="/campaigns">
            Таверна
          </Link>
          <div className={styles.headerUser}>
            <span className={styles.userName}>{me.data?.name}</span>
            <Button view="flat" loading={logout.isPending} onClick={() => logout.mutate()}>
              Выйти
            </Button>
          </div>
        </header>
      </ThemeProvider>
      <ThemeProvider scoped theme="light">
        <div className={styles.workspace}>
          <PageBoundary>
            <Outlet />
          </PageBoundary>
        </div>
      </ThemeProvider>
    </div>
  );
}
