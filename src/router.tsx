import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import { PublicOnly, RequireStaff } from './components/RouteGuards'
import { navGroups, pagePath } from './config/navigation'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import PlannedPage from './pages/PlannedPage'
import ResetPassword from './pages/ResetPassword'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'
import VerifyReset from './pages/VerifyReset'

const groupRoutes: RouteObject[] = navGroups.map((group) => ({
    path: group.base,
    children: [
        { index: true, element: <Navigate to={pagePath(group, group.pages[0])} replace /> },
        ...group.pages.map((page) => {
            const Page = page.element
            return {
                path: page.path,
                children: [
                    { index: true, element: Page ? <Page /> : <PlannedPage group={group} page={page} /> },
                    ...(page.routes ?? []).map(({ path, element: Child }) => ({
                        path,
                        element: <Child />,
                    })),
                ],
            }
        }),
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
        children: [{ index: true, element: <Dashboard /> }, ...groupRoutes],
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
