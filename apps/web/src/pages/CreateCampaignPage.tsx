import {CreateCampaignForm} from '../features/campaign/create/ui/CreateCampaignForm';

export function CreateCampaignPage() {
  return <main className="workspace workspace--narrow campaign-editor">
    <p className="eyebrow">Новая история</p>
    <h1>Создать кампанию</h1>
    <p className="page-intro">Название и обложку увидят все участники. Остальные детали можно будет дополнить позже.</p>
    <CreateCampaignForm />
  </main>;
}
