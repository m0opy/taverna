import type {CampaignDetailDto, CoverKey} from '@taverna/contracts';
import {useState} from 'react';

import {coverLabels} from '../../../entities/campaign/model/presentation';
import {useRotateInvite} from '../../../features/campaign/rotate-invite/model/use-rotate-invite';
import {useUpdateCampaign} from '../../../features/campaign/update/model/use-update-campaign';
import {useCopyInvite} from '../../../features/campaign/invite/model/use-copy-invite';
import {ApiError} from '../../../shared/api/client';
import {NextSessionEditor} from './NextSessionEditor';
import {CampaignMembersSettings} from './CampaignMembersSettings';
import {DangerZone} from './DangerZone';
import styles from './CampaignSettings.module.css';

export function CampaignSettings({campaign}: {campaign: CampaignDetailDto}) {
  const [title, setTitle] = useState(campaign.title);
  const [synopsis, setSynopsis] = useState(campaign.synopsis);
  const [coverKey, setCoverKey] = useState<CoverKey>(campaign.coverKey);
  const update = useUpdateCampaign(campaign.id);
  const rotate = useRotateInvite(campaign.id);
  const invite = useCopyInvite(campaign.inviteUrl);
  const error = update.error instanceof ApiError ? update.error : null;

  return <section className={styles.page}>
    <section className={styles.section}><p className={styles.eyebrow}>Основное</p><h2>История и расписание</h2>
      <form className={styles.form} onSubmit={(event) => { event.preventDefault(); update.mutate({title, synopsis, coverKey}); }}>
        <label><span>Название</span><input disabled={update.isPending} maxLength={60} required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label><span>Сюжет</span><textarea disabled={update.isPending} maxLength={500} rows={5} value={synopsis} onChange={(event) => setSynopsis(event.target.value)} /></label>
        <label><span>Обложка</span><select disabled={update.isPending} value={coverKey} onChange={(event) => setCoverKey(event.target.value as CoverKey)}>{Object.entries(coverLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        {error && <p className={styles.error} role="alert">{error.message}</p>}
        <button className={styles.primary} disabled={update.isPending} type="submit">{update.isPending ? 'Сохраняем…' : 'Сохранить'}</button>
      </form>
      <div className={styles.dateEditor}><NextSessionEditor campaignId={campaign.id} nextSessionAt={campaign.nextSessionAt} /></div>
    </section>
    <section className={styles.section}><p className={styles.eyebrow}>Приглашение</p><h2>Ссылка для игроков</h2>
      <p className={styles.inviteUrl}>{campaign.inviteUrl}</p>
      <div className={styles.actions}><button className={styles.secondary} type="button" onClick={() => void invite.copyInvite()}>{invite.copyState === 'copied' ? 'Скопировано' : 'Скопировать'}</button><button className={styles.secondary} disabled={rotate.isPending} type="button" onClick={() => window.confirm('Старая ссылка перестанет работать. Продолжить?') && rotate.mutate()}> {rotate.isPending ? 'Обновляем…' : 'Обновить ссылку'}</button></div>
      {(invite.copyState === 'error' || rotate.isError) && <p className={styles.error} role="alert">{invite.copyState === 'error' ? 'Не удалось скопировать ссылку.' : 'Не удалось обновить ссылку.'}</p>}
    </section>
    <CampaignMembersSettings campaign={campaign} />
    <DangerZone campaign={campaign} />
  </section>;
}
