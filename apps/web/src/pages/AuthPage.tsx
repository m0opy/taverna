import {Link, useSearchParams} from 'react-router-dom';

import {AuthForm} from '../features/session/ui/auth-form';
import {authHref, safeNext} from '../shared/lib/navigation';
import {CenteredSurface} from '../shared/ui/centered-surface';

interface AuthPageProps {mode: 'login' | 'register'}

export function AuthPage({mode}: AuthPageProps) {
  const isLogin = mode === 'login';
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  return (
    <CenteredSurface top={<Link className="brand" to="/">Таверна</Link>}>
      <p className="eyebrow">{isLogin ? 'С возвращением' : 'Новая история'}</p>
      <h1>{isLogin ? 'Войти в таверну' : 'Создать аккаунт'}</h1>
      <AuthForm mode={mode} next={next} />
      <p className="muted">
        {isLogin ? 'Впервые здесь? ' : 'Уже есть аккаунт? '}
        <Link to={authHref(isLogin ? '/register' : '/login', next)}>{isLogin ? 'Зарегистрироваться' : 'Войти'}</Link>
      </p>
    </CenteredSurface>
  );
}
