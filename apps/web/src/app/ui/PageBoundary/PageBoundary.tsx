import {Suspense, type ReactNode} from 'react';
import {Outlet, useLocation} from 'react-router-dom';

import {PageErrorBoundary} from '../PageErrorBoundary/PageErrorBoundary';
import {PageLoader} from '../PageLoader/PageLoader';

export function PageBoundary({children}: {children: ReactNode}) {
  const {pathname} = useLocation();

  return (
    <PageErrorBoundary key={pathname}>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
}

export function RoutePageBoundary() {
  return (
    <PageBoundary>
      <Outlet />
    </PageBoundary>
  );
}
