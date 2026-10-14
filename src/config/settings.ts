import { Building2, KeyRound, SlidersHorizontal, UserCog, UserRound, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import BusinessSettings from '../pages/settings/BusinessSettings'
import PersonalSettings from '../pages/settings/PersonalSettings'
import PreferencesSettings from '../pages/settings/PreferencesSettings'
import RolePermissions from '../pages/settings/RolePermissions'
import TeamAccess from '../pages/settings/TeamAccess'
import TeamMemberDetail from '../pages/settings/TeamMemberDetail'
import type { Capability } from '../services/userService'
import type { SubRoute } from './navigation'

export const SETTINGS_BASE = '/settings'

export type SettingsTab = {
    label: string
    /** Segment under `/settings`, e.g. `team` renders at `/settings/team`. */
    path: string
    icon: LucideIcon
    element: ComponentType
    routes?: SubRoute[]
    /** Tabs without a permission are visible to everyone who can sign in. */
    permission?: Capability
}

export const settingsTabs: SettingsTab[] = [
    { label: 'Personal', path: 'personal', icon: UserRound, element: PersonalSettings },
    { label: 'Preferences', path: 'preferences', icon: SlidersHorizontal, element: PreferencesSettings },
    { label: 'Business', path: 'business', icon: Building2, element: BusinessSettings },
    {
        label: 'Team & access',
        path: 'team',
        icon: UserCog,
        element: TeamAccess,
        routes: [{ path: ':id', element: TeamMemberDetail }],
        permission: 'team.view',
    },
    { label: 'Role permissions', path: 'roles', icon: KeyRound, element: RolePermissions, permission: 'team.view' },
]

export function settingsTabPath(tab: SettingsTab) {
    return `${SETTINGS_BASE}/${tab.path}`
}
