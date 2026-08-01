import type {MembershipDto} from '@taverna/contracts';
import {CAMPAIGN_MEMBER_LIMIT} from '@taverna/contracts';

import {MembershipList} from '../../../entities/membership/ui/MembershipList';
import {Badge} from '../../../shared/ui/badge';
import styles from './CampaignMembers.module.css';

export function CampaignMembers({members, membersCount}: {members: MembershipDto[]; membersCount: number}) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Состав партии</p>
          <h2>Участники</h2>
        </div>
        <Badge>{membersCount} / {CAMPAIGN_MEMBER_LIMIT}</Badge>
      </div>
      <MembershipList members={members} />
    </section>
  );
}
