import type {CampaignSection} from '../../../entities/campaign/model/presentation';
import {CampaignDetail} from '../../../widgets/campaign-detail/ui/CampaignDetail';

export function CampaignPage({section}: {section: CampaignSection}) {
  return <CampaignDetail section={section} />;
}

export default CampaignPage;
