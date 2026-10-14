import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    getAdminUser,
    listAdminUsers,
    setAdminUserRole,
    updateAdminUser,
    type AdminUserListParams,
    type AdminUserProfileInput,
    type AssignableRole,
} from '../services/adminUserService'

export const adminUserKeys = {
    all: ['admin-users'] as const,
    list: (params: AdminUserListParams) => ['admin-users', 'list', params] as const,
    detail: (id: string) => ['admin-users', 'detail', id] as const,
}

export function useAdminUsers(params: AdminUserListParams) {
    return useQuery({
        queryKey: adminUserKeys.list(params),
        queryFn: () => listAdminUsers(params),
        placeholderData: keepPreviousData,
    })
}

export function useAdminUser(id: string) {
    return useQuery({ queryKey: adminUserKeys.detail(id), queryFn: () => getAdminUser(id) })
}

function useAdminUserMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSettled: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
    })
}

export function useUpdateAdminUser() {
    return useAdminUserMutation(({ id, input }: { id: string; input: AdminUserProfileInput }) =>
        updateAdminUser(id, input),
    )
}

export function useSetAdminUserRole() {
    return useAdminUserMutation(({ id, role }: { id: string; role: AssignableRole }) =>
        setAdminUserRole(id, role),
    )
}
