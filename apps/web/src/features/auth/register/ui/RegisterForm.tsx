import {Button} from '@gravity-ui/uikit';

import {TextField} from '../../../../shared/ui/form-fields';
import {useRegister} from '../model/use-register';
import styles from './RegisterForm.module.css';

interface RegisterFormProps {
  next: string;
}

export function RegisterForm({next}: RegisterFormProps) {
  const form = useRegister(next);

  return (
    <form className={styles.form} onSubmit={form.submit}>
      <TextField
        autoComplete="name"
        label="Имя"
        name="name"
        onUpdate={form.setName}
        placeholder="Как к вам обращаться"
        tone="dark"
        value={form.name}
        {...(form.error?.fields?.name ? {validationState: 'invalid' as const, errorMessage: form.error.fields.name} : {})}
      />
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
        autoComplete="new-password"
        label="Пароль"
        name="password"
        onUpdate={form.setPassword}
        placeholder="Не менее 8 символов"
        tone="dark"
        type="password"
        value={form.password}
      />
      {form.error && <p className={styles.error} role="alert">{form.error.message}</p>}
      <Button view="action" size="xl" width="max" type="submit" loading={form.isPending} disabled={form.isPending}>
        Зарегистрироваться
      </Button>
    </form>
  );
}
