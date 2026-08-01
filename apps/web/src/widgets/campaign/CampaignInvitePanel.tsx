import {Button} from '@gravity-ui/uikit';

import {useCopyInvite} from '../../features/campaign/invite/model/use-copy-invite';
import './campaign-invite-panel.css';

export function CampaignInvitePanel({inviteUrl}: {inviteUrl: string | null}) {
  const invite = useCopyInvite(inviteUrl);

  return <aside className={inviteUrl ? 'invite-panel' : 'invite-panel invite-panel--member'}><p className="eyebrow">{inviteUrl ? 'Приглашение' : 'Ваш доступ'}</p>{inviteUrl ? <><h2>Пригласить игроков</h2><p>Отправьте ссылку тем, кого хотите позвать за игровой стол.</p><div className="invite-copy"><code>{inviteUrl}</code><Button view="action" size="l" onClick={() => void invite.copyInvite()}>{invite.copyState === 'copied' ? 'Скопировано' : 'Копировать ссылку'}</Button></div>{invite.copyState === 'error' && <p className="copy-error" role="alert">Не удалось скопировать. Выделите ссылку вручную.</p>}</> : <><h2>Вы в партии</h2><p>Приглашения управляются мастером кампании. Здесь всегда будет виден ваш текущий доступ.</p></>}</aside>;
}
