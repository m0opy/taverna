import {createBrowserRouter} from 'react-router-dom';

import {AuthPageLazy} from '../pages/auth';
import {CampaignPageLazy, CreateCampaignPageLazy} from '../pages/campaign';
import {CampaignNotesPageLazy} from '../pages/campaign-notes';
import {CampaignNpcsPageLazy} from '../pages/campaign-npcs';
import {CampaignSettingsPageLazy} from '../pages/campaign-settings';
import {DashboardPageLazy} from '../pages/dashboard';
import {JoinPageLazy} from '../pages/join';
import {LandingPageLazy} from '../pages/landing';
import {NotFoundPageLazy} from '../pages/NotFoundPage.lazy';
import {GuestOnlyRoute, ProtectedRoute} from './AuthBoundary';
import {AppLayout} from './ui/AppLayout/AppLayout';
import {RoutePageBoundary} from './ui/PageBoundary/PageBoundary';

export const router = createBrowserRouter([
  {
    element: <RoutePageBoundary />,
    children: [
      {
        element: <GuestOnlyRoute />,
        children: [
          {path: '/', element: <LandingPageLazy />},
          {path: '/login', element: <AuthPageLazy mode="login" />},
          {path: '/register', element: <AuthPageLazy mode="register" />},
        ],
      },
      {path: '/join/:token', element: <JoinPageLazy />},
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {path: '/campaigns', element: <DashboardPageLazy />},
              {path: '/campaigns/new', element: <CreateCampaignPageLazy />},
              {path: '/c/:id', element: <CampaignPageLazy section="home" />},
              {path: '/c/:id/notes', element: <CampaignNotesPageLazy />},
              {path: '/c/:id/npc', element: <CampaignNpcsPageLazy />},
              {path: '/c/:id/settings', element: <CampaignSettingsPageLazy />},
            ],
          },
        ],
      },
      {path: '*', element: <NotFoundPageLazy />},
    ],
  },
]);
