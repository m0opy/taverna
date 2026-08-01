import {createBrowserRouter} from 'react-router-dom';

import {AuthPage} from '../pages/auth/ui/AuthPage';
import {CampaignPage} from '../pages/campaign/ui/CampaignPage';
import {CreateCampaignPage} from '../pages/campaign/ui/CreateCampaignPage';
import {DashboardPage} from '../pages/dashboard/ui/DashboardPage';
import {JoinPage} from '../pages/join/ui/JoinPage';
import {CampaignNotesPage} from '../pages/campaign-notes/ui/CampaignNotesPage';
import {CampaignNpcsPage} from '../pages/campaign-npcs/ui/CampaignNpcsPage';
import {CampaignSettingsPage} from '../pages/campaign-settings/ui/CampaignSettingsPage';
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
          {path: '/campaigns', element: <DashboardPage />},
          {path: '/campaigns/new', element: <CreateCampaignPage />},
          {path: '/c/:id', element: <CampaignPage section="home" />},
          {path: '/c/:id/notes', element: <CampaignNotesPage />},
          {path: '/c/:id/npc', element: <CampaignNpcsPage />},
          {path: '/c/:id/settings', element: <CampaignSettingsPage />},
        ],
      },
    ],
  },
  {path: '*', element: <NotFoundPage />},
]);
