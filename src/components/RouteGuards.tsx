import type { ReactNode } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { safeNext } from '../lib/safeNext'

function LoadingScreen() {
    return (
        <main className="flex min-h-svh items-center justify-center luxury-paper font-poppins text-sm text-ink/60">
            Loading…
        </main>
    )
}

export function RequireStaff({ children }: { children: ReactNode }) {
    const { isLoggedIn, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) return <LoadingScreen />
    if (!isLoggedIn) {
        const next = `${location.pathname}${location.search}`
        return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
    }
    return children
}

export function PublicOnly({ children }: { children: ReactNode }) {
    const { isLoggedIn, isLoading } = useAuth()
    const [searchParams] = useSearchParams()

    if (isLoading) return <LoadingScreen />
    if (isLoggedIn) return <Navigate to={safeNext(searchParams.get('next'))} replace />
    return children
}
