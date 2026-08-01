import type {MembershipDto} from '@taverna/contracts';

import {getMemberSubtitle} from '../model/presentation';
import styles from './MembershipList.module.css';

interface MembershipListProps {
  members: MembershipDto[];
}

export function MembershipList({members}: MembershipListProps) {
  return (
    <div className={styles.list}>
      {members.map((member) => (
        <article className={styles.row} key={member.id}>
          <div className={styles.avatar} aria-hidden="true">
            {(member.characterName ?? member.user.name).slice(0, 1)}
          </div>
          <div className={styles.copy}>
            <div className={styles.nameLine}>
              <strong>{member.characterName ?? member.user.name}</strong>
              {member.isOwner && <span className={styles.ownerBadge}>Мастер</span>}
            </div>
            <p>{getMemberSubtitle(member)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
