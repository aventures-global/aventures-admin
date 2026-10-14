import { api } from './api'
import type { AppUser, AppUserRole, ProfileInput } from './userService'

export type AssignableRole = Exclude<AppUserRole, 'SUPER_ADMIN'>

export type InviteRole = 'STAFF' | 'ADMIN'

export type UserScope = 'team' | 'customers' | 'all'

export type AdminUserListParams = {
    q: string
    scope: UserScope
    role: AppUserRole | 'all'
    sort: 'createdAt' | 'email' | 'role'
    dir: 'asc' | 'desc'
    page: number
    limit: number
}

export type Paged<T> = {
    items: T[]
    total: number
    page: number
    limit: number
}

export type AdminUserPage = Paged<AppUser>

export type PersonSummary = Pick<AppUser, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>

export type ActivityEntry = {
    id: string
    action: string
    metadata: Record<string, unknown>
    createdAt: string
    actor: Omit<PersonSummary, 'role'> | null
    subjectUser: Omit<PersonSummary, 'role'> | null
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'

export type Invitation = {
    id: string
    role: InviteRole
    status: InvitationStatus
    createdAt: string
    expiresAt: string
    respondedAt: string | null
    user: PersonSummary
    invitedBy: PersonSummary | null
}

export type InvitationResult = {
    invitation: Invitation
    emailSent: boolean
    acceptUrl: string | null
}

export async function listAdminUsers(params: AdminUserListParams): Promise<AdminUserPage> {
    const { data } = await api.get<AdminUserPage>('/api/admin/users', { params })
    return data
}

export async function getAdminUser(id: string): Promise<AppUser> {
    const { data } = await api.get<{ user: AppUser }>(`/api/admin/users/${encodeURIComponent(id)}`)
    return data.user
}

export async function updateAdminUser(id: string, input: ProfileInput): Promise<AppUser> {
    const { data } = await api.patch<{ user: AppUser }>(`/api/admin/users/${encodeURIComponent(id)}`, input)
    return data.user
}

export async function setAdminUserRole(id: string, role: AssignableRole): Promise<AppUser> {
    const { data } = await api.patch<{ user: AppUser }>(`/api/admin/users/${encodeURIComponent(id)}/role`, {
        role,
    })
    return data.user
}

export async function getUserActivity(id: string, page: number): Promise<Paged<ActivityEntry>> {
    const { data } = await api.get<Paged<ActivityEntry>>(`/api/admin/users/${encodeURIComponent(id)}/activity`, {
        params: { page, limit: 20 },
    })
    return data
}

export async function listInvitations(params: { status?: InvitationStatus | 'all'; userId?: string }) {
    const { data } = await api.get<Invitation[]>('/api/admin/invitations', { params })
    return data
}

export async function createInvitation(input: { userId: string; role: InviteRole }) {
    const { data } = await api.post<InvitationResult>('/api/admin/invitations', input)
    return data
}

export async function revokeInvitation(id: string) {
    const { data } = await api.post<Invitation>(`/api/admin/invitations/${encodeURIComponent(id)}/revoke`)
    return data
}

export type InvitationPreview = {
    role: InviteRole
    status: InvitationStatus
    email: string | null
    invitedBy: string
    expiresAt: string
}

export async function lookupInvitation(token: string) {
    const { data } = await api.post<InvitationPreview>('/api/invitations/lookup', { token })
    return data
}

export async function acceptInvitation(token: string) {
    const { data } = await api.post<{ role: InviteRole; email: string | null }>('/api/invitations/accept', {
        token,
    })
    return data
}
