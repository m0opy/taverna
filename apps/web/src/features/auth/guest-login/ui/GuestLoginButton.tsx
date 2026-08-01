import {Button} from '@gravity-ui/uikit';

import {ApiError} from '../../../../shared/api/client';
import {useGuestLogin} from '../model/use-guest-login';
import styles from './GuestLoginButton.module.css';

export function GuestLoginButton({next}: {next: string}) {
  const login = useGuestLogin(next);
  const error = login.error instanceof ApiError ? login.error : null;
  const demoEmail = import.meta.env.VITE_DEMO_EMAIL ?? 'demo@tavern.app';

  return (
    <div className={styles.container}>
      <div className={styles.divider}><span>или</span></div>
      <Button disabled={login.isPending} loading={login.isPending} size="xl" view="outlined" width="max" type="button" onClick={() => login.mutate()}>
        Войти как гость
      </Button>
      <p className={styles.hint}>Демо-доступ: {demoEmail}. Одна кнопка — и вы сразу увидите наполненный мир.</p>
      {error && <p className={styles.error} role="alert">{error.message}</p>}
    </div>
  );
}
