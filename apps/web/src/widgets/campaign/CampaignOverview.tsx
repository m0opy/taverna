import {formatCampaignDate} from '../../shared/lib/date';
import '../../entities/campaign/ui/campaign-cover.css';
import './campaign-overview.css';

interface CampaignOverviewProps {coverKey: string;nextSessionAt: string | null;synopsis: string;}

export function CampaignOverview({coverKey, nextSessionAt, synopsis}: CampaignOverviewProps) {
  return <section className={`campaign-hero campaign-cover--${coverKey}`}><div className="campaign-hero__copy"><p className="eyebrow">О кампании</p><p className="campaign-synopsis">{synopsis || 'Мастер ещё не добавил описание этой истории.'}</p></div><div className="session-block"><span>Следующая игра</span><strong>{formatCampaignDate(nextSessionAt)}</strong></div></section>;
}
