import {Link} from 'react-router-dom';

import {campaignSections, type CampaignSection} from '../../../entities/campaign/model/presentation';
import styles from './CampaignTabs.module.css';

interface CampaignTabsProps {
  campaignId: string;
  isOwner: boolean;
  section: CampaignSection;
}

export function CampaignTabs({campaignId, isOwner, section}: CampaignTabsProps) {
  return (
    <nav className={styles.tabs} aria-label="Разделы кампании">
      {Object.entries(campaignSections)
        .filter(([key]) => key !== 'settings' || isOwner)
        .map(([key, label]) => (
          <Link
            aria-current={section === key ? 'page' : undefined}
            className={section === key ? `${styles.item} ${styles.active}` : styles.item}
            key={key}
            to={key === 'home' ? `/c/${campaignId}` : `/c/${campaignId}/${key}`}
          >
            {label}
          </Link>
        ))}
    </nav>
  );
}
