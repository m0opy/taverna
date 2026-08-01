import type {CampaignListResponse} from '@taverna/contracts';
import {Link} from 'react-router-dom';

import {formatCampaignDate} from '../../../shared/lib/date';
import './campaign-card.css';
import './campaign-cover.css';

export function CampaignCard({campaign}: {campaign: CampaignListResponse['items'][number]}) {
  return (
    <Link className={`campaign-card campaign-cover--${campaign.coverKey}`} to={`/c/${campaign.id}`}>
      <span className="eyebrow">{campaign.myRole === 'master' ? 'Мастер' : 'Игрок'} · {campaign.membersCount} участников</span>
      <h2>{campaign.title}</h2>
      <p>{campaign.nextSessionAt ? `Следующая игра: ${formatCampaignDate(campaign.nextSessionAt)}` : 'Дата следующей игры не назначена'}</p>
    </Link>
  );
}
