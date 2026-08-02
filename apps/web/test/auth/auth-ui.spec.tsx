import {renderToStaticMarkup} from 'react-dom/server';
import type {ReactNode} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {ApiError} from '../../src/shared/api/client';
import {useDemoLoginAvailability} from '../../src/features/auth/guest-login/model/use-demo-login-availability';
import {useGuestLogin} from '../../src/features/auth/guest-login/model/use-guest-login';
import {GuestLoginButton} from '../../src/features/auth/guest-login/ui/GuestLoginButton';
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
    TextField: ({hint, label, name, type, value}: {hint?: ReactNode; label: string; name?: string; type?: string; value?: string}) =>
      createElement('label', null, createElement('span', null, label), createElement('input', {name, type, value}), hint),
  };
});

vi.mock('../../src/features/auth/guest-login/model/use-demo-login-availability', () => ({useDemoLoginAvailability: vi.fn()}));
vi.mock('../../src/features/auth/guest-login/model/use-guest-login', () => ({useGuestLogin: vi.fn()}));
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
  vi.mocked(useDemoLoginAvailability).mockReturnValue({isAvailable: true, isKnown: true});
  vi.mocked(useGuestLogin).mockReturnValue({error: null, isPending: false, mutate: vi.fn()});
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
    vi.mocked(useRegister).mockReturnValue({
      ...authFormState(),
      error: new ApiError(409, 'Этот email уже зарегистрирован', 'EMAIL_TAKEN', {email: 'Этот email уже зарегистрирован'}),
    });

    const markup = renderToStaticMarkup(<RegisterForm next="/campaigns" />);

    expect(markup).toContain('Имя');
    expect(markup).toContain('Зарегистрироваться');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Этот email уже зарегистрирован');
  });

  it('disables the submit action while login is pending', () => {
    vi.mocked(useLogin).mockReturnValue({...authFormState(), isPending: true});

    const markup = renderToStaticMarkup(<LoginForm next="/campaigns" />);

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('data-loading="true"');
  });

  it('renders field-level auth validation as alerts', () => {
    vi.mocked(useLogin).mockReturnValue({
      ...authFormState(),
      error: new ApiError(400, 'Проверьте поля формы и попробуйте снова.', 'VALIDATION_ERROR', {
        email: 'Введите корректный email',
        password: 'Пароль должен быть не короче 8 символов',
      }),
    });

    const markup = renderToStaticMarkup(<LoginForm next="/campaigns" />);

    expect(markup).toContain('Введите корректный email');
    expect(markup).toContain('Пароль должен быть не короче 8 символов');
    expect((markup.match(/role="alert"/g) ?? [])).toHaveLength(2);
  });

  it('keeps the guest CTA honest about demo availability', () => {
    const markup = renderToStaticMarkup(<GuestLoginButton next="/campaigns" />);

    expect(markup).toContain('Гостевой вход доступен на стендах с настроенным демо-пользователем.');
    expect(markup).not.toContain('наполненный мир');
  });

  it('hides the guest CTA when demo login is disabled', () => {
    vi.mocked(useDemoLoginAvailability).mockReturnValue({isAvailable: false, isKnown: true});

    const markup = renderToStaticMarkup(<GuestLoginButton next="/campaigns" />);

    expect(markup).toBe('');
  });

  it('hides the guest CTA until demo capability is confirmed', () => {
    vi.mocked(useDemoLoginAvailability).mockReturnValue({isAvailable: false, isKnown: false});

    const markup = renderToStaticMarkup(<GuestLoginButton next="/campaigns" />);

    expect(markup).toBe('');
  });
});
