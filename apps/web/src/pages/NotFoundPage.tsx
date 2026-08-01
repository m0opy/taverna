import {Button} from '@gravity-ui/uikit';

import {CenteredSurface} from '../shared/ui/centered-surface';

export function NotFoundPage() {
  return <CenteredSurface><p className="eyebrow">404</p><h1>Тропа затерялась</h1><p>Такой страницы в хрониках нет.</p><Button view="action" href="/">Вернуться в таверну</Button></CenteredSurface>;
}

export default NotFoundPage;
