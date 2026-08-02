import {Button} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {useDocumentTitle} from '../../../shared/lib/use-document-title';
import {CampaignList} from '../../../widgets/campaign-list/ui/CampaignList';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const navigate = useNavigate();
  useDocumentTitle('Ваши кампании');

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Ваш игровой стол</p>
          <h1>Ваши кампании</h1>
        </div>
        <Button view="action" size="l" onClick={() => navigate('/campaigns/new')}>Создать кампанию</Button>
      </div>
      <CampaignList />
    </main>
  );
}

export default DashboardPage;
