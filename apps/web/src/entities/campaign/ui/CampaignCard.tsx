import type {CampaignListResponse} from '@taverna/contracts';
import {Link} from 'react-router-dom';

import {formatCampaignDate} from '../../../shared/lib/date';
import {formatParticipantCount} from '../../../shared/lib/russian';
import coverStyles from './CampaignCover.module.css';
import styles from './CampaignCard.module.css';

export function CampaignCard({campaign}: {campaign: CampaignListResponse['items'][number]}) {
  return (
    <Link className={`${styles.card} ${coverStyles[campaign.coverKey]}`} to={`/c/${campaign.id}`}>
      <span className={styles.eyebrow}>{campaign.myRole === 'master' ? 'Мастер' : 'Игрок'} · {formatParticipantCount(campaign.membersCount)}</span>
      <h2>{campaign.title}</h2>
      <p>{campaign.nextSessionAt ? `Следующая игра: ${formatCampaignDate(campaign.nextSessionAt)}` : 'Дата следующей игры не назначена'}</p>
    </Link>
  );
}
