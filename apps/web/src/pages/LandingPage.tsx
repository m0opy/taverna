import {Button} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';
import './landing-page.css';

export function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing__nav" aria-label="Основная навигация">
        <Link className="brand" to="/">Таверна</Link>
        <Link className="text-link" to="/login">Войти</Link>
      </nav>
      <section className="landing__hero">
        <p className="eyebrow">Дневник вашей партии</p>
        <h1>Все истории кампании<br />за одним столом.</h1>
        <p className="landing__copy">
          Персонажи, заметки и встречи с NPC — в общем пространстве, которое не потеряется между игровыми сессиями.
        </p>
        <div className="actions">
          <Button view="action" size="xl" href="/register">Собрать партию</Button>
          <Button view="outlined" size="xl" href="/login">У меня есть аккаунт</Button>
        </div>
      </section>
      <section className="chronicle" aria-label="Предпросмотр хроники">
        <div className="chronicle__mark">III</div>
        <div>
          <p className="eyebrow">Последняя запись</p>
          <h2>Тени над Красным трактом</h2>
          <p>Отряд добрался до старой заставы. Борден знает больше, чем говорит.</p>
        </div>
        <span className="chronicle__date">12 августа</span>
      </section>
    </main>
  );
}
