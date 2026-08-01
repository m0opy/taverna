import {Link, useSearchParams} from 'react-router-dom';

import {LoginForm} from '../../../features/auth/login/ui/LoginForm';
import {RegisterForm} from '../../../features/auth/register/ui/RegisterForm';
import {authHref, safeNext} from '../../../shared/lib/navigation';
import {CenteredSurface} from '../../../shared/ui/centered-surface';
import styles from './AuthPage.module.css';

export interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({mode}: AuthPageProps) {
  const isLogin = mode === 'login';
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  return (
    <CenteredSurface panelClassName={styles.panel ?? ''} top={<Link className={styles.brand} to="/">Таверна</Link>}>
      <p className={styles.eyebrow}>{isLogin ? 'С возвращением' : 'Новая история'}</p>
      <h1>{isLogin ? 'Войти в таверну' : 'Создать аккаунт'}</h1>
      {isLogin ? <LoginForm next={next} /> : <RegisterForm next={next} />}
      <p className={styles.muted}>
        {isLogin ? 'Впервые здесь? ' : 'Уже есть аккаунт? '}
        <Link to={authHref(isLogin ? '/register' : '/login', next)}>{isLogin ? 'Зарегистрироваться' : 'Войти'}</Link>
      </p>
    </CenteredSurface>
  );
}
