import {createBrowserRouter} from 'react-router-dom';

import {AuthPage} from '../pages/AuthPage';
import {CampaignPage} from '../pages/CampaignPage';
import {CampaignsPage} from '../pages/CampaignsPage';
import {JoinPage} from '../pages/JoinPage';
import {LandingPage} from '../pages/LandingPage';
import {NotFoundPage} from '../pages/NotFoundPage';
import {CreateCampaignPage} from '../pages/CreateCampaignPage';
import {AppShell} from '../widgets/app-shell/AppShell';
import {GuestOnlyRoute, ProtectedRoute} from './AuthBoundary';

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
        element: <AppShell />,
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
