import type {CampaignDetailDto} from '@taverna/contracts';
import {useState} from 'react';

import {useDeleteCampaign} from '../../../features/campaign/delete/model/use-delete-campaign';
import {ApiError} from '../../../shared/api/client';
import styles from './DangerZone.module.css';

export function DangerZone({campaign}: {campaign: CampaignDetailDto}) {
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const remove = useDeleteCampaign(campaign.id);
  const error = remove.error instanceof ApiError ? remove.error : null;
  return <section className={styles.section}><p className={styles.eyebrow}>Опасная зона</p><h2>Удалить кампанию</h2><p>Это действие необратимо. Введите точное название: <strong>{campaign.title}</strong></p><label><span>Название кампании</span><input disabled={remove.isPending} value={confirmationTitle} onChange={(event) => setConfirmationTitle(event.target.value)} /></label>{error && <p className={styles.error} role="alert">{error.message}</p>}<button disabled={remove.isPending || confirmationTitle !== campaign.title} type="button" onClick={() => remove.mutate(confirmationTitle)}>{remove.isPending ? 'Удаляем…' : 'Удалить кампанию'}</button></section>;
}
