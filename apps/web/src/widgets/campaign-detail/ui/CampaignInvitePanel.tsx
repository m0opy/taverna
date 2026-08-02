import {Button} from '@gravity-ui/uikit';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {useCopyInvite} from '../../../features/campaign/invite/model/use-copy-invite';
import {useRemoveMember} from '../../../features/campaign/remove-member/model/use-remove-member';
import {ApiError} from '../../../shared/api/client';
import {ConfirmDialog} from '../../../shared/ui/ConfirmDialog';
import styles from './CampaignInvitePanel.module.css';

export function CampaignInvitePanel({campaignId, inviteUrl, myMembershipId}: {campaignId: string; inviteUrl: string | null; myMembershipId: string}) {
  const navigate = useNavigate();
  const invite = useCopyInvite(inviteUrl);
  const remove = useRemoveMember(campaignId);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  return (
    <aside className={inviteUrl ? styles.panel : `${styles.panel} ${styles.memberPanel}`}>
      <p className={styles.eyebrow}>{inviteUrl ? 'Приглашение' : 'Ваш доступ'}</p>
      {inviteUrl ? (
        <>
          <h2>Пригласить игроков</h2>
          <p>Отправьте ссылку тем, кого хотите позвать за игровой стол.</p>
          <div className={styles.copy}>
            <code>{inviteUrl}</code>
            <Button view="action" size="l" onClick={() => void invite.copyInvite()}>
              {invite.copyState === 'copied' ? 'Скопировано' : 'Копировать ссылку'}
            </Button>
          </div>
          {invite.copyState === 'error' && <p className={styles.copyError} role="alert">Не удалось скопировать. Выделите ссылку вручную.</p>}
        </>
      ) : (
        <>
          <h2>Вы в партии</h2>
          <p>Приглашения управляются мастером кампании. Здесь всегда будет виден ваш текущий доступ.</p>
          <div className={styles.memberActions}>
            <Button view="outlined" size="l" onClick={() => setIsLeaveDialogOpen(true)}>Покинуть кампанию</Button>
          </div>
          {remove.error instanceof ApiError && <p className={styles.copyError} role="alert">{remove.error.message}</p>}
        </>
      )}
      {isLeaveDialogOpen && <ConfirmDialog confirmLabel="Покинуть кампанию" description="Вы потеряете доступ к заметкам, NPC и составу партии, пока мастер не пригласит вас снова." isPending={remove.isPending} pendingLabel="Выходим…" title="Покинуть кампанию?" onCancel={() => setIsLeaveDialogOpen(false)} onConfirm={() => remove.mutate(myMembershipId, {onSuccess: () => navigate('/campaigns', {replace: true, state: {notice: 'Вы покинули кампанию.'}})})} />}
    </aside>
  );
}
