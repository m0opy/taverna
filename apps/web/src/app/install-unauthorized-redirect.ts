import type {QueryClient} from '@tanstack/react-query';

import {meQuery} from '../entities/session/api/me-query';
import {subscribeUnauthorized} from '../shared/api/auth-events';
import {authHref} from '../shared/lib/navigation';
import {router} from './router';

let installed = false;

export function installUnauthorizedRedirect(queryClient: QueryClient) {
  if (installed) return;
  installed = true;

  subscribeUnauthorized(() => {
    const {pathname, search, hash} = router.state.location;

    queryClient.clear();
    queryClient.setQueryData(meQuery.queryKey, null);

    if (pathname === '/login' || pathname === '/register') {
      return;
    }

    const next = `${pathname}${search}${hash}`;
    void router.navigate(authHref('/login', next), {replace: true});
  });
}
