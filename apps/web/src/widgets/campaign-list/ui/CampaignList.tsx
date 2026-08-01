import type {CampaignListResponse} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {useCampaigns} from '../../../entities/campaign/api/use-campaigns';
import {ApiError} from '../../../shared/api/client';
import {CampaignCard} from '../../../entities/campaign/ui/CampaignCard';
import styles from './CampaignList.module.css';

type CampaignSummary = CampaignListResponse['items'][number];

export function CampaignList() {
  const campaigns = useCampaigns();

  if (campaigns.isPending) {
    return <CampaignListLoadingState />;
  }

  if (campaigns.isError || !campaigns.data) {
    const isForbidden = campaigns.error instanceof ApiError && campaigns.error.status === 403;

    return (
      <section className={styles.emptyState} role="alert">
        <h2>{isForbidden ? 'Список кампаний недоступен' : 'Не удалось открыть хроники'}</h2>
        <p>{isForbidden ? 'У этой сессии нет доступа к списку кампаний.' : 'Проверьте соединение и попробуйте ещё раз.'}</p>
        <Button onClick={() => campaigns.refetch()}>Повторить</Button>
      </section>
    );
  }

  return <CampaignListView items={campaigns.data.items} />;
}

export function CampaignListLoadingState() {
  return <p className={styles.statusMessage}>Собираем хроники…</p>;
}

export function CampaignListView({items}: {items: CampaignSummary[]}) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <section className={styles.emptyState}>
        <div className={styles.emptySigil} aria-hidden="true">✦</div>
        <h2>Здесь начнётся первая история</h2>
        <p>Создайте кампанию или попросите мастера прислать ссылку-приглашение.</p>
        <Button view="outlined-action" size="l" onClick={() => navigate('/campaigns/new')}>Зажечь первый огонь</Button>
      </section>
    );
  }

  return (
    <section className={styles.grid} aria-label="Список кампаний">
      {items.map((campaign) => <CampaignCard campaign={campaign} key={campaign.id} />)}
    </section>
  );
}
