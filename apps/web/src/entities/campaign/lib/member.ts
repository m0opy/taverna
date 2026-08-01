interface MemberPresentation {
  characterClass: string | null;
  characterName: string | null;
  isOwner: boolean;
  user: {name: string};
}

export function getMemberSubtitle(member: MemberPresentation): string {
  if (member.isOwner) return member.characterName ? `Мастер · ${member.user.name}` : 'Мастер кампании';
  if (member.characterName && member.characterClass) return `${member.characterClass} · ${member.user.name}`;
  if (member.characterName) return member.user.name;
  return member.characterClass || 'Игрок';
}
