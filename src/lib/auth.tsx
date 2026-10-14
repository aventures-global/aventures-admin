import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setAccessToken, setTokenRefresher } from '../services/api'
import { clearStoredPreferences } from './appearance'
import { bootstrapUser, type AppUser, type AppUserRole, type Capability } from '../services/userService'
import { AuthContext, type AuthContextValue, type SessionStatus } from './authContext'
import {
    getAccessToken,
    getSession,
    signInEmail,
    signInWithGoogle,
    signOut,
} from './authApi'

const ALLOWED_ROLES: AppUserRole[] = ['STAFF', 'ADMIN', 'SUPER_ADMIN']

setTokenRefresher(getAccessToken)

const ACCESS_DENIED_MESSAGE =
    'This account does not have admin access yet. Ask the super admin to grant your account staff or admin access.'

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient()
    const [appUser, setAppUser] = useState<AppUser | null>(null)
    const [permissions, setPermissions] = useState<Capability[]>([])
    const [neonName, setNeonName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [otp, setOtp] = useState<string | null>(null)

    const clearLocal = useCallback(() => {
        setAccessToken(null)
        setAppUser(null)
        setPermissions([])
        setNeonName('')
    }, [])

    const applySession = useCallback(async (): Promise<SessionStatus> => {
        const session = await getSession()
        const sessionUser = session?.user
        if (!sessionUser?.id || !sessionUser.email) {
            clearLocal()
            return 'signed-out'
        }

        const accessToken =
            (session as { session?: { token?: string } } | null)?.session?.token ??
            (await getAccessToken())
        if (!accessToken) {
            clearLocal()
            return 'signed-out'
        }

        setAccessToken(accessToken)
        let synced: AppUser
        let capabilities: Capability[]
        try {
            ;({ user: synced, permissions: capabilities } = await bootstrapUser({
                name: sessionUser.name,
                email: sessionUser.email,
                image: sessionUser.image,
            }))
        } catch (err) {
            clearLocal()
            throw err
        }

        if (!ALLOWED_ROLES.includes(synced.role)) {
            await signOut()
            clearLocal()
            setError(ACCESS_DENIED_MESSAGE)
            return 'denied'
        }

        setNeonName(sessionUser.name?.trim() || sessionUser.email)
        setAppUser(synced)
        setPermissions(capabilities)
        return 'allowed'
    }, [clearLocal])

    const refresh = useCallback(async () => {
        setError(null)
        try {
            return await applySession()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh session')
            return 'signed-out' as const
        }
    }, [applySession])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                await applySession()
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load session')
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [applySession])

    const login = useCallback(
        async (input: { email: string; password: string }) => {
            setError(null)
            await signInEmail(input)
            const status = await applySession()
            if (status === 'denied') throw new Error(ACCESS_DENIED_MESSAGE)
            if (status === 'signed-out') throw new Error('Could not start a session. Try again.')
        },
        [applySession],
    )

    const loginWithGoogle = useCallback(async () => {
        setError(null)
        await signInWithGoogle()
    }, [])

    const logout = useCallback(async () => {
        setError(null)
        await signOut()
        clearLocal()
        clearStoredPreferences()
        queryClient.clear()
    }, [clearLocal, queryClient])

    const value = useMemo<AuthContextValue>(() => {
        const fullName = appUser
            ? [appUser.firstName, appUser.lastName].filter(Boolean).join(' ')
            : ''
        return {
            appUser,
            displayName: fullName || appUser?.email || neonName,
            isLoggedIn: Boolean(appUser),
            isLoading,
            error,
            otp,
            setVerificationCode: setOtp,
            login,
            loginWithGoogle,
            logout,
            refresh,
            can: (capability) => permissions.includes(capability),
        }
    }, [appUser, permissions, neonName, isLoading, error, otp, login, loginWithGoogle, logout, refresh])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
