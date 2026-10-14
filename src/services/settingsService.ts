import { api } from './api'
import type { Capability } from './userService'

export type BusinessSettings = {
    email: string
    phoneDisplay: string
    addressLines: string[]
    facebookUrl: string
    instagramUrl: string
    tiktokUrl: string
    facebookHandle: string
    instagramHandle: string
    tiktokHandle: string
}

export type ConfigurableRole = 'STAFF' | 'ADMIN'

export type RolePermissions = {
    capabilities: Capability[]
    roles: Record<ConfigurableRole, Capability[]>
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
    const { data } = await api.get<BusinessSettings>('/api/settings/business')
    return data
}

export async function updateBusinessSettings(input: BusinessSettings): Promise<BusinessSettings> {
    const { data } = await api.put<BusinessSettings>('/api/settings/business', input)
    return data
}

export async function getRolePermissions(): Promise<RolePermissions> {
    const { data } = await api.get<RolePermissions>('/api/settings/roles')
    return data
}

export async function updateRolePermissions(roles: RolePermissions['roles']): Promise<RolePermissions> {
    const { data } = await api.put<RolePermissions>('/api/settings/roles', roles)
    return data
}
