import {Button, ThemeProvider} from '@gravity-ui/uikit';
import {Link, Outlet} from 'react-router-dom';

import {useCurrentUser} from '../../features/session/api/me-query';
import {useLogout} from '../../features/session/model/use-logout';
import './app-shell.css';

export function AppShell() {
  const me = useCurrentUser();
  const logout = useLogout();

  return <div className="app-frame">
    <ThemeProvider scoped theme="dark"><header className="app-header"><Link className="brand" to="/campaigns">Таверна</Link><div className="app-header__user"><span>{me.data?.name}</span><Button view="flat" loading={logout.isPending} onClick={() => logout.mutate()}>Выйти</Button></div></header></ThemeProvider>
    <ThemeProvider scoped theme="light"><div className="app-workspace"><Outlet /></div></ThemeProvider>
  </div>;
}
