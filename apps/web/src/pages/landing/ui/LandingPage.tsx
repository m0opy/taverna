import {Button} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import styles from './LandingPage.module.css';

export function LandingPage() {
  return (
    <main className={styles.landing}>
      <nav className={styles.landingNav} aria-label="Основная навигация">
        <Link className={styles.brand} to="/">
          Таверна
        </Link>
        <Link className={styles.textLink} to="/login">
          Войти
        </Link>
      </nav>
      <section className={styles.landingHero}>
        <p className={styles.eyebrow}>Дневник вашей партии</p>
        <h1>
          Все истории кампании
          <br />
          за одним столом.
        </h1>
        <p className={styles.landingCopy}>
          Персонажи, заметки и встречи с NPC — в общем пространстве, которое не потеряется между
          игровыми сессиями.
        </p>
        <div className={styles.actions}>
          <Button view="action" size="xl" href="/register">
            Собрать партию
          </Button>
          <Button view="outlined" size="xl" href="/login">
            У меня есть аккаунт
          </Button>
        </div>
      </section>
      <section className={styles.chronicle} aria-label="Предпросмотр хроники">
        <div className={styles.chronicleMark}>III</div>
        <div>
          <p className={styles.eyebrow}>Последняя запись</p>
          <h2>Тени над Красным трактом</h2>
          <p>Отряд добрался до старой заставы. Борден знает больше, чем говорит.</p>
        </div>
        <span className={styles.chronicleDate}>12 августа</span>
      </section>
    </main>
  );
}
