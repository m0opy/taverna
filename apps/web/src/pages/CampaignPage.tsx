import {useParams} from 'react-router-dom';

import {useCampaign} from '../entities/campaign/api/use-campaigns';
import {campaignSections, type CampaignSection} from '../entities/campaign/model/presentation';
import {Badge} from '../shared/ui/badge';
import {CampaignInvitePanel} from '../widgets/campaign/CampaignInvitePanel';
import {CampaignMembers} from '../widgets/campaign/CampaignMembers';
import {CampaignOverview} from '../widgets/campaign/CampaignOverview';
import {CampaignTabs} from '../widgets/campaign/CampaignTabs';
import './campaign-page.css';

export function CampaignPage({section}: {section: CampaignSection}) {
  const {id = ''} = useParams();
  const campaign = useCampaign(id);

  if (campaign.isPending) return <main className="workspace"><p className="status-message">Открываем хронику…</p></main>;
  if (campaign.isError || !campaign.data) return <main className="workspace"><section className="empty-state"><h2>Кампания недоступна</h2><p>Возможно, вы больше не состоите в этой кампании.</p></section></main>;

  const data = campaign.data;
  const isOwner = data.myRole === 'master';

  return <main className="workspace campaign-page"><header className="campaign-heading"><div><p className="eyebrow">Кампания</p><h1>{data.title}</h1></div><Badge>{isOwner ? 'Мастер' : 'Участник'}</Badge></header><CampaignTabs campaignId={id} isOwner={isOwner} section={section} />{section !== 'home' ? <section className="campaign-section-placeholder"><p className="eyebrow">Раздел</p><h2>{campaignSections[section]}</h2><p>Раздел подготовлен и появится в следующем этапе разработки.</p></section> : <><CampaignOverview coverKey={data.coverKey} nextSessionAt={data.nextSessionAt} synopsis={data.synopsis} /><div className="campaign-columns"><CampaignMembers members={data.members} membersCount={data.membersCount} /><CampaignInvitePanel inviteUrl={data.inviteUrl} /></div></>}</main>;
}
