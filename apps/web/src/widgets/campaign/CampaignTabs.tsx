import {Link} from 'react-router-dom';

import {campaignSections, type CampaignSection} from '../../entities/campaign/model/presentation';
import './campaign-tabs.css';

interface CampaignTabsProps {campaignId: string;isOwner: boolean;section: CampaignSection;}

export function CampaignTabs({campaignId, isOwner, section}: CampaignTabsProps) {
  return <nav className="tabs" aria-label="Разделы кампании">{Object.entries(campaignSections).filter(([key]) => key !== 'settings' || isOwner).map(([key, label]) => <Link className={section === key ? 'tabs__item tabs__item--active' : 'tabs__item'} key={key} to={key === 'home' ? `/c/${campaignId}` : `/c/${campaignId}/${key}`}>{label}</Link>)}</nav>;
}
