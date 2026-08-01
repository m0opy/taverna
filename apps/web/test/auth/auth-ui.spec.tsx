import {renderToStaticMarkup} from 'react-dom/server';
import type {ReactNode} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {ApiError} from '../../src/shared/api/client';
import {useLogin} from '../../src/features/auth/login/model/use-login';
import {useRegister} from '../../src/features/auth/register/model/use-register';
import {LoginForm} from '../../src/features/auth/login/ui/LoginForm';
import {RegisterForm} from '../../src/features/auth/register/ui/RegisterForm';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    Button: ({children, loading, ...props}: {children: ReactNode; loading?: boolean; [key: string]: unknown}) =>
      createElement('button', {...props, 'data-loading': loading ? 'true' : 'false'}, children),
  };
});

vi.mock('../../src/shared/ui/form-fields', async () => {
  const {createElement} = await import('react');
  return {
    TextField: ({label, name, type, value}: {label: string; name?: string; type?: string; value?: string}) =>
      createElement('label', null, createElement('span', null, label), createElement('input', {name, type, value})),
  };
});

vi.mock('../../src/features/auth/login/model/use-login', () => ({useLogin: vi.fn()}));
vi.mock('../../src/features/auth/register/model/use-register', () => ({useRegister: vi.fn()}));

function authFormState(): ReturnType<typeof useLogin> {
  return {
    email: '',
    error: null,
    isPending: false,
    name: '',
    password: '',
    setEmail: vi.fn(),
    setName: vi.fn(),
    setPassword: vi.fn(),
    submit: vi.fn(),
  };
}

beforeEach(() => {
  vi.mocked(useLogin).mockReturnValue(authFormState());
  vi.mocked(useRegister).mockReturnValue(authFormState());
});

describe('auth forms', () => {
  it('renders login fields without registration-only name input', () => {
    const markup = renderToStaticMarkup(<LoginForm next="/campaigns" />);

    expect(markup).toContain('Email');
    expect(markup).toContain('Пароль');
    expect(markup).not.toContain('Имя');
    expect(markup).toContain('Войти');
  });

  it('renders registration fields and exposes API errors', () => {
    vi.mocked(useRegister).mockReturnValue({...authFormState(), error: new ApiError(409, 'Email is already registered', 'EMAIL_TAKEN')});

    const markup = renderToStaticMarkup(<RegisterForm next="/campaigns" />);

    expect(markup).toContain('Имя');
    expect(markup).toContain('Зарегистрироваться');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Email is already registered');
  });

  it('disables the submit action while login is pending', () => {
    vi.mocked(useLogin).mockReturnValue({...authFormState(), isPending: true});

    const markup = renderToStaticMarkup(<LoginForm next="/campaigns" />);

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('data-loading="true"');
  });
});
