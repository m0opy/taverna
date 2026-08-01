import {Button} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {useCampaigns} from '../entities/campaign/api/use-campaigns';
import {CampaignCard} from '../entities/campaign/ui/CampaignCard';
import './campaigns-page.css';

export function CampaignsPage() {
  const navigate = useNavigate();
  const campaigns = useCampaigns();

  return <main className="workspace"><div className="page-heading"><div><p className="eyebrow">Ваш игровой стол</p><h1>Ваши кампании</h1></div><Button view="action" size="l" onClick={() => navigate('/campaigns/new')}>Создать кампанию</Button></div>{campaigns.isPending && <p className="status-message">Собираем хроники…</p>}{campaigns.isError && <section className="empty-state"><h2>Не удалось открыть хроники</h2><p>Проверьте соединение и попробуйте ещё раз.</p><Button onClick={() => campaigns.refetch()}>Повторить</Button></section>}{campaigns.data?.items.length === 0 && <section className="empty-state"><div className="empty-state__sigil">✦</div><h2>Здесь начнётся первая история</h2><p>Создайте кампанию или попросите мастера прислать ссылку-приглашение.</p><Button view="outlined-action" size="l" onClick={() => navigate('/campaigns/new')}>Зажечь первый огонь</Button></section>}{Boolean(campaigns.data?.items.length) && <section className="campaign-grid">{campaigns.data?.items.map((campaign) => <CampaignCard campaign={campaign} key={campaign.id} />)}</section>}</main>;
}
