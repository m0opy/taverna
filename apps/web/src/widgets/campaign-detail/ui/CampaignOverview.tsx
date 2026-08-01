import type {CoverKey} from '@taverna/contracts';

import {formatCampaignDate} from '../../../shared/lib/date';
import coverStyles from '../../../entities/campaign/ui/CampaignCover.module.css';
import styles from './CampaignOverview.module.css';

interface CampaignOverviewProps {
  coverKey: CoverKey;
  nextSessionAt: string | null;
  synopsis: string;
}

export function CampaignOverview({coverKey, nextSessionAt, synopsis}: CampaignOverviewProps) {
  return (
    <section className={`${styles.hero} ${coverStyles[coverKey]}`}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>О кампании</p>
        <p className={styles.synopsis}>{synopsis || 'Мастер ещё не добавил описание этой истории.'}</p>
      </div>
      <div className={styles.sessionBlock}>
        <span>Следующая игра</span>
        <strong>{formatCampaignDate(nextSessionAt)}</strong>
      </div>
    </section>
  );
}
