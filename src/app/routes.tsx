import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { HomePage } from '@/pages/HomePage'
import { ActivityPage } from '@/pages/ActivityPage'
import { GroupsPage } from '@/pages/GroupsPage'
import { GroupDetailView } from '@/features/groups/GroupDetailView'
import { JoinGroupView } from '@/features/groups/JoinGroupView'
import { InsightsPage } from '@/pages/InsightsPage'
import { ProfilePage } from '@/pages/ProfilePage'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <AuthGuard>
          <AppShell />
        </AuthGuard>
      ),
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: 'activity',
          element: <ActivityPage />,
        },
        {
          path: 'groups',
          element: <GroupsPage />,
        },
        {
          path: 'groups/:groupId',
          element: <GroupDetailView />,
        },
        {
          path: 'join/:inviteCode',
          element: <JoinGroupView />,
        },
        {
          path: 'insights',
          element: <InsightsPage />,
        },
        {
          path: 'profile',
          element: <ProfilePage />,
        },
        {
          path: '*',
          element: <Navigate to="/" replace />,
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL || import.meta.env.VITE_BASE_URL || '/',
  }
)
