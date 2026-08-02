import {Button} from '@gravity-ui/uikit';

import {TextField} from '../../../../shared/ui/form-fields';
import {GuestLoginButton} from '../../guest-login/ui/GuestLoginButton';
import {useLogin} from '../model/use-login';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  next: string;
}

export function LoginForm({next}: LoginFormProps) {
  const form = useLogin(next);
  const hasFieldErrors = Boolean(form.error?.fields && Object.keys(form.error.fields).length > 0);
  const emailError = form.error?.fields?.email;
  const passwordError = form.error?.fields?.password;

  return (
    <form className={styles.form} onSubmit={form.submit}>
      <TextField
        autoComplete="email"
        hint={emailError ? <span role="alert">{emailError}</span> : undefined}
        label="Email"
        name="email"
        onUpdate={form.setEmail}
        placeholder="name@example.com"
        tone="dark"
        type="email"
        value={form.email}
        {...(emailError ? {validationState: 'invalid' as const} : {})}
      />
      <TextField
        autoComplete="current-password"
        hint={passwordError ? <span role="alert">{passwordError}</span> : undefined}
        label="Пароль"
        name="password"
        onUpdate={form.setPassword}
        placeholder="Введите пароль"
        tone="dark"
        type="password"
        value={form.password}
        {...(passwordError ? {validationState: 'invalid' as const} : {})}
      />
      {form.error && !hasFieldErrors && <p className={styles.error} role="alert">{form.error.message}</p>}
      <Button view="action" size="xl" width="max" type="submit" loading={form.isPending} disabled={form.isPending}>
        Войти
      </Button>
      <GuestLoginButton next={next} />
    </form>
  );
}
