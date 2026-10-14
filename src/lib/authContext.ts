import { createContext, useContext } from 'react'
import type { AppUser, Capability } from '../services/userService'

export type SessionStatus = 'signed-out' | 'allowed' | 'denied'

export type AuthContextValue = {
    appUser: AppUser | null
    displayName: string
    isLoggedIn: boolean
    isLoading: boolean
    error: string | null
    otp: string | null
    setVerificationCode: (otp: string | null) => void
    login: (input: { email: string; password: string }) => Promise<void>
    loginWithGoogle: () => Promise<void>
    logout: () => Promise<void>
    refresh: () => Promise<SessionStatus>
    can: (capability: Capability) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
