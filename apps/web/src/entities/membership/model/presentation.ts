import type {MembershipDto} from '@taverna/contracts';

export type MembershipPresentation = Pick<
  MembershipDto,
  'characterClass' | 'characterName' | 'isOwner'
> & {user: Pick<MembershipDto['user'], 'name'>};

export function getMemberSubtitle(member: MembershipPresentation): string {
  if (member.isOwner) return member.characterName ? `Мастер · ${member.user.name}` : 'Мастер кампании';
  if (member.characterName && member.characterClass) return `${member.characterClass} · ${member.user.name}`;
  if (member.characterName) return member.user.name;
  return member.characterClass || 'Игрок';
}
