import {createBrowserRouter} from 'react-router-dom';

import {AuthPage} from '../pages/auth/ui/AuthPage';
import {CampaignPage} from '../pages/CampaignPage';
import {CampaignsPage} from '../pages/CampaignsPage';
import {CreateCampaignPage} from '../pages/CreateCampaignPage';
import {JoinPage} from '../pages/JoinPage';
import {NotFoundPage} from '../pages/NotFoundPage';
import {LandingPage} from '../pages/landing/ui/LandingPage';
import {GuestOnlyRoute, ProtectedRoute} from './AuthBoundary';
import {AppLayout} from './ui/AppLayout/AppLayout';

export const router = createBrowserRouter([
  {
    element: <GuestOnlyRoute />,
    children: [
      {path: '/', element: <LandingPage />},
      {path: '/login', element: <AuthPage mode="login" />},
      {path: '/register', element: <AuthPage mode="register" />},
    ],
  },
  {path: '/join/:token', element: <JoinPage />},
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {path: '/campaigns', element: <CampaignsPage />},
          {path: '/campaigns/new', element: <CreateCampaignPage />},
          {path: '/c/:id', element: <CampaignPage section="home" />},
          {path: '/c/:id/notes', element: <CampaignPage section="notes" />},
          {path: '/c/:id/npc', element: <CampaignPage section="npc" />},
          {path: '/c/:id/settings', element: <CampaignPage section="settings" />},
        ],
      },
    ],
  },
  {path: '*', element: <NotFoundPage />},
]);
