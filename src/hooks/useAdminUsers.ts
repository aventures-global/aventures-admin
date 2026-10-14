import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    createInvitation,
    getAdminUser,
    getUserActivity,
    listAdminUsers,
    listInvitations,
    revokeInvitation,
    setAdminUserRole,
    updateAdminUser,
    type AdminUserListParams,
    type AssignableRole,
    type InvitationStatus,
    type InviteRole,
} from '../services/adminUserService'
import type { ProfileInput } from '../services/userService'

export const adminUserKeys = {
    all: ['admin-users'] as const,
    list: (params: AdminUserListParams) => ['admin-users', 'list', params] as const,
    detail: (id: string) => ['admin-users', 'detail', id] as const,
    activity: (id: string, page: number) => ['admin-users', 'activity', id, page] as const,
    invitations: (params: { status?: InvitationStatus | 'all'; userId?: string }) =>
        ['admin-users', 'invitations', params] as const,
}

export function useAdminUsers(params: AdminUserListParams, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: adminUserKeys.list(params),
        queryFn: () => listAdminUsers(params),
        placeholderData: keepPreviousData,
        enabled: options.enabled,
    })
}

export function useAdminUser(id: string) {
    return useQuery({ queryKey: adminUserKeys.detail(id), queryFn: () => getAdminUser(id) })
}

export function useUserActivity(id: string, page: number) {
    return useQuery({
        queryKey: adminUserKeys.activity(id, page),
        queryFn: () => getUserActivity(id, page),
        placeholderData: keepPreviousData,
    })
}

export function useInvitations(params: { status?: InvitationStatus | 'all'; userId?: string }) {
    return useQuery({ queryKey: adminUserKeys.invitations(params), queryFn: () => listInvitations(params) })
}

function useAdminUserMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSettled: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
    })
}

export function useUpdateAdminUser() {
    return useAdminUserMutation(({ id, input }: { id: string; input: ProfileInput }) => updateAdminUser(id, input))
}

export function useSetAdminUserRole() {
    return useAdminUserMutation(({ id, role }: { id: string; role: AssignableRole }) =>
        setAdminUserRole(id, role),
    )
}

export function useCreateInvitation() {
    return useAdminUserMutation((input: { userId: string; role: InviteRole }) => createInvitation(input))
}

export function useRevokeInvitation() {
    return useAdminUserMutation((id: string) => revokeInvitation(id))
}
