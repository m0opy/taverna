import {Button} from '@gravity-ui/uikit';

import {TextField} from '../../../shared/ui/form-fields';
import type {AuthMode} from '../model/use-auth-form';
import {useAuthForm} from '../model/use-auth-form';

interface AuthFormProps {mode: AuthMode;next: string;}

export function AuthForm({mode, next}: AuthFormProps) {
  const form = useAuthForm(mode, next);
  const isLogin = mode === 'login';

  return (
    <form className="form-stack" onSubmit={form.submit}>
      {!isLogin && <TextField autoComplete="name" label="Имя" name="name" onUpdate={form.setName} placeholder="Как к вам обращаться" tone="dark" value={form.name} {...(form.error?.fields?.name ? {validationState: 'invalid' as const, errorMessage: form.error.fields.name} : {})} />}
      <TextField autoComplete="email" label="Email" name="email" onUpdate={form.setEmail} placeholder="name@example.com" tone="dark" type="email" value={form.email} {...(form.error?.fields?.email ? {validationState: 'invalid' as const, errorMessage: form.error.fields.email} : {})} />
      <TextField autoComplete={isLogin ? 'current-password' : 'new-password'} label="Пароль" name="password" onUpdate={form.setPassword} placeholder={isLogin ? 'Введите пароль' : 'Не менее 8 символов'} tone="dark" type="password" value={form.password} />
      {form.error && <p className="form-error" role="alert">{form.error.message}</p>}
      <Button view="action" size="xl" width="max" type="submit" loading={form.isPending} disabled={form.isPending}>{isLogin ? 'Войти' : 'Зарегистрироваться'}</Button>
    </form>
  );
}
