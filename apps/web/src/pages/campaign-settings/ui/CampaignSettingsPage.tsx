import {useParams} from 'react-router-dom';

import {useCampaign} from '../../../entities/campaign/api/use-campaigns';
import {CampaignTabs} from '../../../widgets/campaign-detail/ui/CampaignTabs';
import {ApiError} from '../../../shared/api/client';
import {CampaignDetailErrorState, CampaignDetailLoadingState} from '../../../widgets/campaign-detail/ui/CampaignDetail';
import {CampaignSettings} from '../../../widgets/campaign-settings/ui/CampaignSettings';
import {Badge} from '../../../shared/ui/badge';
import detailStyles from '../../../widgets/campaign-detail/ui/CampaignDetail.module.css';
import styles from './CampaignSettingsPage.module.css';

export function CampaignSettingsPage() {
  const {id = ''} = useParams<{id: string}>();
  const campaign = useCampaign(id);
  if (campaign.isPending) return <CampaignDetailLoadingState />;
  if (campaign.isError || !campaign.data) return <CampaignDetailErrorState status={campaign.error instanceof ApiError ? campaign.error.status : null} onRetry={() => void campaign.refetch()} />;
  if (campaign.data.myRole !== 'master') return <CampaignDetailErrorState status={403} />;
  return (
    <main className={`${detailStyles.page} ${detailStyles.campaignPage} ${styles.page}`}>
      <header className={detailStyles.heading}>
        <div>
          <p className={detailStyles.eyebrow}>Кампания · {campaign.data.title}</p>
          <h1>Настройки</h1>
        </div>
        <Badge>Мастер</Badge>
      </header>
      <CampaignTabs campaignId={id} isOwner section="settings" />
      <CampaignSettings campaign={campaign.data} />
    </main>
  );
}

export default CampaignSettingsPage;
