import { api } from './api'
import type { AppUser, AppUserRole } from './userService'

export type AssignableRole = Exclude<AppUserRole, 'SUPER_ADMIN'>

export type AdminUserListParams = {
    q: string
    role: AppUserRole | 'all'
    sort: 'createdAt' | 'email' | 'role'
    dir: 'asc' | 'desc'
    page: number
    limit: number
}

export type AdminUserPage = {
    items: AppUser[]
    total: number
    page: number
    limit: number
}

export type AdminUserProfileInput = {
    firstName: string | null
    lastName: string | null
    phone: string | null
}

export async function listAdminUsers(params: AdminUserListParams): Promise<AdminUserPage> {
    const { data } = await api.get<AdminUserPage>('/api/admin/users', { params })
    return data
}

export async function getAdminUser(id: string): Promise<AppUser> {
    const { data } = await api.get<{ user: AppUser }>(`/api/admin/users/${encodeURIComponent(id)}`)
    return data.user
}

export async function updateAdminUser(id: string, input: AdminUserProfileInput): Promise<AppUser> {
    const { data } = await api.patch<{ user: AppUser }>(`/api/admin/users/${encodeURIComponent(id)}`, input)
    return data.user
}

export async function setAdminUserRole(id: string, role: AssignableRole): Promise<AppUser> {
    const { data } = await api.patch<{ user: AppUser }>(`/api/admin/users/${encodeURIComponent(id)}/role`, {
        role,
    })
    return data.user
}
