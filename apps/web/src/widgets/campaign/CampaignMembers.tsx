import type {MembershipDto} from '@taverna/contracts';

import {getMemberSubtitle} from '../../entities/campaign/lib/member';
import {Badge} from '../../shared/ui/badge';
import './campaign-members.css';

export function CampaignMembers({members, membersCount}: {members: MembershipDto[];membersCount: number}) {
  return <section className="members-section"><div className="section-heading"><div><p className="eyebrow">Состав партии</p><h2>Участники</h2></div><Badge>{membersCount} / 20</Badge></div><div className="member-list">{members.map((member) => <article className="member-row" key={member.id}><div className="member-avatar" aria-hidden="true">{(member.characterName ?? member.user.name).slice(0, 1)}</div><div className="member-copy"><div className="member-name-line"><strong>{member.characterName ?? member.user.name}</strong>{member.isOwner && <Badge size="small">Мастер</Badge>}</div><p>{getMemberSubtitle(member)}</p></div></article>)}</div></section>;
}
