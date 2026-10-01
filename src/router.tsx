import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import { PublicOnly, RequireStaff } from './components/RouteGuards'
import { CMS_BASE, cmsItems, cmsPath } from './config/navigation'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'
import VerifyReset from './pages/VerifyReset'

const cmsRoutes: RouteObject[] = cmsItems.map(({ path, element: Page, routes = [] }) => ({
    path,
    children: [
        { index: true, element: <Page /> },
        ...routes.map(({ path: childPath, element: Child }) => ({
            path: childPath,
            element: <Child />,
        })),
    ],
}))

const publicPages = [
    { path: '/login', Page: Login },
    { path: '/signup', Page: Signup },
    { path: '/verify-email', Page: VerifyEmail },
    { path: '/forgot-password', Page: ForgotPassword },
    { path: '/verify-reset', Page: VerifyReset },
    { path: '/reset-password', Page: ResetPassword },
]

export const router = createBrowserRouter([
    {
        element: (
            <RequireStaff>
                <AdminLayout />
            </RequireStaff>
        ),
        children: [
            { index: true, element: <Dashboard /> },
            {
                path: CMS_BASE,
                children: [
                    { index: true, element: <Navigate to={cmsPath(cmsItems[0])} replace /> },
                    ...cmsRoutes,
                ],
            },
        ],
    },
    ...publicPages.map(({ path, Page }) => ({
        path,
        element: (
            <PublicOnly>
                <Page />
            </PublicOnly>
        ),
    })),
    { path: '*', element: <Navigate to="/" replace /> },
])
