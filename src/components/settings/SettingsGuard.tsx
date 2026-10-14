import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { SettingsTab } from '../../config/settings'
import { useAuth } from '../../lib/authContext'

export default function SettingsGuard({ tab, children }: { tab: SettingsTab; children: ReactNode }) {
    const { can } = useAuth()
    if (tab.permission && !can(tab.permission)) return <Navigate to="/settings" replace />
    return children
}
