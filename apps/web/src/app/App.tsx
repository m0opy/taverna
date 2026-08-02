import {RouterProvider} from 'react-router-dom';

import {installUnauthorizedRedirect} from './install-unauthorized-redirect';
import {AppProviders, queryClient} from './providers';
import {router} from './router';

installUnauthorizedRedirect(queryClient);

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
