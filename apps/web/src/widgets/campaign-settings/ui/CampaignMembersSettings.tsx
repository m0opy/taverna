import type {CampaignDetailDto} from '@taverna/contracts';
import {useState} from 'react';

import {useRemoveMember} from '../../../features/campaign/remove-member/model/use-remove-member';
import {ApiError} from '../../../shared/api/client';
import {ConfirmDialog} from '../../../shared/ui/ConfirmDialog';
import styles from './CampaignMembersSettings.module.css';

export function CampaignMembersSettings({campaign}: {campaign: CampaignDetailDto}) {
  const remove = useRemoveMember(campaign.id);
  const [targetId, setTargetId] = useState<string | null>(null);
  const target = campaign.members.find((member) => member.id === targetId);
  const isOwner = campaign.myRole === 'master';
  const isSelf = targetId === campaign.myMembershipId;
  const error = remove.error instanceof ApiError ? remove.error : null;

  return <section className={styles.section}>
    <div><p className={styles.eyebrow}>Состав партии</p><h2>Участники</h2></div>
    <ul className={styles.list}>{campaign.members.map((member) => <li key={member.id}><span><strong>{member.characterName ?? member.user.name}</strong><small>{member.isOwner ? 'Мастер' : member.user.name}</small></span>{!member.isOwner && (isOwner || member.id === campaign.myMembershipId) && <button type="button" onClick={() => setTargetId(member.id)}>{isOwner ? 'Исключить' : 'Покинуть кампанию'}</button>}</li>)}</ul>
    {error && <p className={styles.error} role="alert">{error.message}</p>}
    {target && <ConfirmDialog confirmLabel={isOwner && !isSelf ? 'Исключить' : 'Покинуть'} description={isOwner && !isSelf ? `Участник ${target.user.name} потеряет доступ к кампании.` : 'После выхода вы потеряете доступ к кампании.'} isPending={remove.isPending} title={isOwner && !isSelf ? 'Исключить участника?' : 'Покинуть кампанию?'} onCancel={() => setTargetId(null)} onConfirm={() => remove.mutate(target.id, {onSuccess: () => setTargetId(null)})} />}
  </section>;
}
