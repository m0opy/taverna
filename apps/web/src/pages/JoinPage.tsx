import {Button} from '@gravity-ui/uikit';
import {useNavigate, useParams} from 'react-router-dom';

import {JoinCampaignForm} from '../features/campaign/join/ui/join-campaign-form';
import {useJoinCampaign} from '../features/campaign/join/model/use-join-campaign';
import {authHref} from '../shared/lib/navigation';
import {CenteredSurface} from '../shared/ui/centered-surface';
import './join-page.css';

export function JoinPage() {
  const {token = ''} = useParams();
  const navigate = useNavigate();
  const flow = useJoinCampaign(token);

  if (flow.preview.isPending) return <main className="centered-page"><p className="status-message">Проверяем приглашение…</p></main>;
  if (flow.previewError?.code === 'INVITE_INVALID' || !flow.preview.data) {
    return <CenteredSurface><p className="eyebrow">Приглашение</p><h1>Эта дверь закрыта</h1><p>Ссылка недействительна или мастер уже обновил приглашение.</p><Button onClick={() => navigate('/')}>На главную</Button></CenteredSurface>;
  }

  const data = flow.preview.data;

  return (
    <CenteredSurface className="join-page" panelClassName="join-panel">
      <p className="eyebrow">Приглашение от {data.ownerName}</p>
      <h1>{data.title}</h1>
      <p>{data.synopsis || 'Вас приглашают присоединиться к новой истории.'}</p>
      <div className="invite-facts"><span>{data.membersCount}/20 участников</span><span>{data.coverKey}</span></div>
      {data.isFull ? (
        <div className="form-error"><strong>За столом нет свободных мест</strong><p>Попросите мастера освободить место и попробуйте снова.</p></div>
      ) : flow.isGuest ? (
        <div className="actions"><Button view="action" size="l" onClick={() => navigate(authHref('/login', `/join/${token}`))}>Войти</Button><Button view="outlined" size="l" onClick={() => navigate(authHref('/register', `/join/${token}`))}>Регистрация</Button></div>
      ) : flow.me.data ? (
        <JoinCampaignForm
          characterClass={flow.characterClass}
          characterInfo={flow.characterInfo}
          characterName={flow.characterName}
          isPending={flow.isPending}
          onCharacterClassUpdate={flow.setCharacterClass}
          onCharacterInfoChange={(event) => flow.setCharacterInfo(event.target.value)}
          onCharacterNameUpdate={flow.setCharacterName}
          onSubmit={flow.submit}
          {...(flow.joinError ? {errorMessage: flow.joinError.message} : {})}
        />
      ) : <p className="form-error">Не удалось проверить сессию. Обновите страницу.</p>}
    </CenteredSurface>
  );
}
