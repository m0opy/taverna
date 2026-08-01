import {Button} from '@gravity-ui/uikit';

import {TextField} from '../../../../shared/ui/form-fields';
import {useLogin} from '../model/use-login';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  next: string;
}

export function LoginForm({next}: LoginFormProps) {
  const form = useLogin(next);

  return (
    <form className={styles.form} onSubmit={form.submit}>
      <TextField
        autoComplete="email"
        label="Email"
        name="email"
        onUpdate={form.setEmail}
        placeholder="name@example.com"
        tone="dark"
        type="email"
        value={form.email}
        {...(form.error?.fields?.email ? {validationState: 'invalid' as const, errorMessage: form.error.fields.email} : {})}
      />
      <TextField
        autoComplete="current-password"
        label="Пароль"
        name="password"
        onUpdate={form.setPassword}
        placeholder="Введите пароль"
        tone="dark"
        type="password"
        value={form.password}
      />
      {form.error && <p className={styles.error} role="alert">{form.error.message}</p>}
      <Button view="action" size="xl" width="max" type="submit" loading={form.isPending} disabled={form.isPending}>
        Войти
      </Button>
    </form>
  );
}
