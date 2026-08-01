import {Button} from '@gravity-ui/uikit';

import {useCopyInvite} from '../../../features/campaign/invite/model/use-copy-invite';
import styles from './CampaignInvitePanel.module.css';

export function CampaignInvitePanel({inviteUrl}: {inviteUrl: string | null}) {
  const invite = useCopyInvite(inviteUrl);

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
        </>
      )}
    </aside>
  );
}
