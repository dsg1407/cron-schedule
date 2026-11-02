import { createBrowserRouter } from 'react-router'
import { AppLayout } from './pages/_layouts/app-layout'
import { AuthLayout } from './pages/_layouts/auth-layout'
import { CronJobs } from './pages/app/cron-jobs/cron-jobs'
import { Dashboard } from './pages/app/dashboard/dashboard'
import { Docs } from './pages/app/docs/docs'
import { Executions } from './pages/app/executions/executions'
import { Settings } from './pages/app/settings/settings'
import { SignIn } from './pages/auth/sign-in'
import { SignUp } from './pages/auth/sign-up'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'cron-jobs', element: <CronJobs /> },
      { path: 'executions', element: <Executions /> },
      { path: 'settings', element: <Settings /> },
      { path: 'docs', element: <Docs /> },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'sign-in', element: <SignIn /> },
      { path: 'sign-up', element: <SignUp /> },
    ],
  },
])
