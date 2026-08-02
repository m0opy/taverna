import {Button} from '@gravity-ui/uikit';

import {TextField} from '../../../../shared/ui/form-fields';
import {useRegister} from '../model/use-register';
import styles from './RegisterForm.module.css';

interface RegisterFormProps {
  next: string;
}

export function RegisterForm({next}: RegisterFormProps) {
  const form = useRegister(next);
  const hasFieldErrors = Boolean(form.error?.fields && Object.keys(form.error.fields).length > 0);
  const nameError = form.error?.fields?.name;
  const emailError = form.error?.fields?.email;
  const passwordError = form.error?.fields?.password;

  return (
    <form className={styles.form} onSubmit={form.submit}>
      <TextField
        autoComplete="name"
        hint={nameError ? <span role="alert">{nameError}</span> : undefined}
        label="Имя"
        name="name"
        onUpdate={form.setName}
        placeholder="Как к вам обращаться"
        tone="dark"
        value={form.name}
        {...(nameError ? {validationState: 'invalid' as const} : {})}
      />
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
        autoComplete="new-password"
        hint={passwordError ? <span role="alert">{passwordError}</span> : undefined}
        label="Пароль"
        name="password"
        onUpdate={form.setPassword}
        placeholder="Не менее 8 символов"
        tone="dark"
        type="password"
        value={form.password}
        {...(passwordError ? {validationState: 'invalid' as const} : {})}
      />
      {form.error && !hasFieldErrors && <p className={styles.error} role="alert">{form.error.message}</p>}
      <Button view="action" size="xl" width="max" type="submit" loading={form.isPending} disabled={form.isPending}>
        Зарегистрироваться
      </Button>
    </form>
  );
}
