import {CreateCampaignForm} from '../../../features/campaign/create/ui/CreateCampaignForm';
import {useDocumentTitle} from '../../../shared/lib/use-document-title';
import styles from './CreateCampaignPage.module.css';

export function CreateCampaignPage() {
  useDocumentTitle('Создать кампанию');

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Новая история</p>
      <h1>Создать кампанию</h1>
      <p className={styles.intro}>Название и обложку увидят все участники. Остальные детали можно будет дополнить позже.</p>
      <CreateCampaignForm />
    </main>
  );
}

export default CreateCampaignPage;
