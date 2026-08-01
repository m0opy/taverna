import type {CampaignDetailDto} from '@taverna/contracts';
import {useParams} from 'react-router-dom';

import {useCampaign} from '../../../entities/campaign/api/use-campaigns';
import {campaignSections, type CampaignSection} from '../../../entities/campaign/model/presentation';
import {ApiError} from '../../../shared/api/client';
import {Badge} from '../../../shared/ui/badge';
import {CampaignInvitePanel} from './CampaignInvitePanel';
import {CampaignMembers} from './CampaignMembers';
import {CampaignOverview} from './CampaignOverview';
import {CampaignTabs} from './CampaignTabs';
import styles from './CampaignDetail.module.css';

export function CampaignDetail({section}: {section: CampaignSection}) {
  const {id = ''} = useParams<{id: string}>();
  const campaign = useCampaign(id);

  if (campaign.isPending) {
    return <CampaignDetailLoadingState />;
  }

  if (campaign.isError || !campaign.data) {
    const status = campaign.error instanceof ApiError ? campaign.error.status : null;
    return <CampaignDetailErrorState status={status} onRetry={() => void campaign.refetch()} />;
  }

  return <CampaignDetailView campaign={campaign.data} id={id} section={section} />;
}

export function CampaignDetailLoadingState() {
  return <main className={styles.page}><p className={styles.statusMessage}>Открываем хронику…</p></main>;
}

export function CampaignDetailErrorState({status, onRetry}: {status: number | null; onRetry?: () => void}) {
  const title = status === 403 ? 'Нет доступа к кампании' : status === 404 ? 'Кампания не найдена' : 'Кампания недоступна';
  const message = status === 403
    ? 'Возможно, вы больше не состоите в этой кампании.'
    : status === 404
      ? 'Проверьте ссылку или вернитесь к списку кампаний.'
      : 'Проверьте соединение и попробуйте ещё раз.';

  return (
    <main className={styles.page}>
      <section className={styles.errorState} role="alert">
        <p className={styles.eyebrow}>{status ?? 'Ошибка'}</p>
        <h2>{title}</h2>
        <p>{message}</p>
        <button className={styles.retryButton} type="button" onClick={onRetry}>Повторить</button>
      </section>
    </main>
  );
}

export function CampaignDetailView({campaign, id, section}: {campaign: CampaignDetailDto; id: string; section: CampaignSection}) {
  const isOwner = campaign.myRole === 'master';

  return (
    <main className={`${styles.page} ${styles.campaignPage}`}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Кампания</p>
          <h1>{campaign.title}</h1>
        </div>
        <Badge>{isOwner ? 'Мастер' : 'Участник'}</Badge>
      </header>
      <CampaignTabs campaignId={id} isOwner={isOwner} section={section} />
      {section !== 'home' ? (
        <section className={styles.placeholder}>
          <p className={styles.eyebrow}>Раздел</p>
          <h2>{campaignSections[section]}</h2>
          <p>Раздел подготовлен и появится в следующем этапе разработки.</p>
        </section>
      ) : (
        <>
          <CampaignOverview coverKey={campaign.coverKey} nextSessionAt={campaign.nextSessionAt} synopsis={campaign.synopsis} />
          <div className={styles.columns}>
            <CampaignMembers members={campaign.members} membersCount={campaign.membersCount} />
            <CampaignInvitePanel inviteUrl={campaign.inviteUrl} />
          </div>
        </>
      )}
    </main>
  );
}
