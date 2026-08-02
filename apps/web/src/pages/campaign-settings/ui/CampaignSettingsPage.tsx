import type {CampaignDetailDto} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import {useCampaign} from '../../../entities/campaign/api/use-campaigns';
import {useRemoveMember} from '../../../features/campaign/remove-member/model/use-remove-member';
import {CampaignTabs} from '../../../widgets/campaign-detail/ui/CampaignTabs';
import {ApiError} from '../../../shared/api/client';
import {useDocumentTitle} from '../../../shared/lib/use-document-title';
import {ConfirmDialog} from '../../../shared/ui/ConfirmDialog';
import {CampaignDetailErrorState, CampaignDetailLoadingState} from '../../../widgets/campaign-detail/ui/CampaignDetail';
import {CampaignSettings} from '../../../widgets/campaign-settings/ui/CampaignSettings';
import {Badge} from '../../../shared/ui/badge';
import detailStyles from '../../../widgets/campaign-detail/ui/CampaignDetail.module.css';
import styles from './CampaignSettingsPage.module.css';

function PlayerSettingsAccessState({campaign, campaignId}: {campaign: CampaignDetailDto; campaignId: string}) {
  const navigate = useNavigate();
  const remove = useRemoveMember(campaignId);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  return (
    <main className={`${detailStyles.page} ${detailStyles.campaignPage} ${styles.page}`}>
      <section className={detailStyles.errorState} role="alert">
        <p className={detailStyles.eyebrow}>403</p>
        <h2>Настройки доступны только мастеру</h2>
        <p>Вы всё ещё состоите в кампании. Вернитесь в хронику, откройте заметки или покиньте кампанию прямо отсюда.</p>
        <div className={styles.actions}>
          <Button view="action" size="l" onClick={() => navigate(`/c/${campaignId}`)}>Вернуться в кампанию</Button>
          <button className={styles.secondary} type="button" onClick={() => navigate(`/c/${campaignId}/notes`)}>Открыть заметки</button>
          <button className={styles.danger} type="button" onClick={() => setIsLeaveDialogOpen(true)}>Покинуть кампанию</button>
        </div>
        {remove.error instanceof ApiError && <p className={styles.error} role="alert">{remove.error.message}</p>}
      </section>
      {isLeaveDialogOpen && <ConfirmDialog confirmLabel="Покинуть кампанию" description="Вы потеряете доступ к этой истории, заметкам и NPC, пока мастер не пригласит вас снова." isPending={remove.isPending} pendingLabel="Выходим…" title="Покинуть кампанию?" onCancel={() => setIsLeaveDialogOpen(false)} onConfirm={() => remove.mutate(campaign.myMembershipId, {onSuccess: () => navigate('/campaigns', {replace: true, state: {notice: 'Вы покинули кампанию.'}})})} />}
    </main>
  );
}

export function CampaignSettingsPage() {
  const {id = ''} = useParams<{id: string}>();
  const campaign = useCampaign(id);
  useDocumentTitle('Настройки', campaign.data?.title);

  if (campaign.isPending) return <CampaignDetailLoadingState />;
  if (campaign.isError || !campaign.data) return <CampaignDetailErrorState status={campaign.error instanceof ApiError ? campaign.error.status : null} onRetry={() => void campaign.refetch()} />;
  if (campaign.data.myRole !== 'master') return <PlayerSettingsAccessState campaign={campaign.data} campaignId={id} />;
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
