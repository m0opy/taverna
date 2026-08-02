import {Button} from '@gravity-ui/uikit';
import {CAMPAIGN_MEMBER_LIMIT} from '@taverna/contracts';
import {useNavigate, useParams} from 'react-router-dom';

import {coverLabels} from '../../../entities/campaign/model/presentation';
import {JoinCampaignForm} from '../../../features/campaign/join/ui/JoinCampaignForm';
import {useJoinCampaign} from '../../../features/campaign/join/model/use-join-campaign';
import {authHref} from '../../../shared/lib/navigation';
import {useDocumentTitle} from '../../../shared/lib/use-document-title';
import {CenteredSurface} from '../../../shared/ui/centered-surface';
import styles from './JoinPage.module.css';

export function JoinPage() {
  const {token = ''} = useParams();
  const navigate = useNavigate();
  const flow = useJoinCampaign(token);
  const joinTitle = flow.preview.data
    ? 'Присоединиться к кампании'
    : flow.previewError?.code === 'INVITE_INVALID'
      ? 'Приглашение недействительно'
      : 'Приглашение';

  useDocumentTitle(joinTitle, flow.preview.data?.title);

  if (flow.preview.isPending) return <main className={styles.loading}><p>Проверяем приглашение…</p></main>;
  if (flow.previewError?.code === 'INVITE_INVALID' || !flow.preview.data) {
    return (
      <CenteredSurface className={styles.page ?? ''} panelClassName={styles.panel ?? ''}>
        <p className={styles.eyebrow}>Приглашение</p>
        <h1>Эта дверь закрыта</h1>
        <p>Ссылка недействительна или мастер уже обновил приглашение.</p>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </CenteredSurface>
    );
  }

  const data = flow.preview.data;

  return (
    <CenteredSurface className={styles.page ?? ''} panelClassName={styles.panel ?? ''}>
      <p className={styles.eyebrow}>Приглашение от {data.ownerName}</p>
      <h1>{data.title}</h1>
      <p>{data.synopsis || 'Вас приглашают присоединиться к новой истории.'}</p>
      <div className={styles.facts}><span>{data.membersCount} из {CAMPAIGN_MEMBER_LIMIT} участников</span><span>{coverLabels[data.coverKey]}</span></div>
      {data.isFull ? (
        <div className={styles.formError}><strong>За столом нет свободных мест</strong><p>Попросите мастера освободить место и попробуйте снова.</p></div>
      ) : flow.isGuest ? (
        <div className={styles.actions}><Button view="action" size="l" onClick={() => navigate(authHref('/login', `/join/${token}`))}>Войти</Button><Button view="outlined" size="l" onClick={() => navigate(authHref('/register', `/join/${token}`))}>Регистрация</Button></div>
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
          {...(flow.joinFieldErrors ? {fieldErrors: flow.joinFieldErrors} : {})}
          {...(flow.joinError?.code === 'ALREADY_MEMBER' && typeof flow.joinError.meta?.campaignId === 'string' ? {openCampaignHref: `/c/${flow.joinError.meta.campaignId}`} : {})}
          {...(flow.joinError ? {errorMessage: flow.joinError.message} : {})}
        />
      ) : <p className={styles.formError}>Не удалось проверить сессию. Обновите страницу.</p>}
    </CenteredSurface>
  );
}

export default JoinPage;
