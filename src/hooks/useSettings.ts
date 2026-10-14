import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { storedPreferences } from '../lib/appearance'
import {
    getBusinessSettings,
    getRolePermissions,
    updateBusinessSettings,
    updateRolePermissions,
    type BusinessSettings,
    type RolePermissions,
} from '../services/settingsService'
import { getPreferences, updateMe, updatePreferences, type Preferences, type ProfileInput } from '../services/userService'

const settingsKeys = {
    business: ['settings', 'business'] as const,
    roles: ['settings', 'roles'] as const,
    preferences: ['settings', 'preferences'] as const,
}

export function useBusinessSettings() {
    return useQuery({ queryKey: settingsKeys.business, queryFn: getBusinessSettings })
}

export function useUpdateBusinessSettings() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: BusinessSettings) => updateBusinessSettings(input),
        onSuccess: (data) => queryClient.setQueryData(settingsKeys.business, data),
    })
}

export function useRolePermissions() {
    return useQuery({ queryKey: settingsKeys.roles, queryFn: getRolePermissions })
}

export function useUpdateRolePermissions() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (roles: RolePermissions['roles']) => updateRolePermissions(roles),
        onSuccess: (data) => queryClient.setQueryData(settingsKeys.roles, data),
    })
}

export function usePreferences(enabled = true) {
    return useQuery({ queryKey: settingsKeys.preferences, queryFn: getPreferences, enabled })
}

export function useUpdatePreferences() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: Partial<Preferences>) => updatePreferences(input),
        onMutate: (input) =>
            queryClient.setQueryData<Preferences>(settingsKeys.preferences, (current) => ({
                ...(current ?? storedPreferences()),
                ...input,
            })),
        onSettled: () => queryClient.invalidateQueries({ queryKey: settingsKeys.preferences }),
    })
}

export function useUpdateMe() {
    return useMutation({
        mutationFn: (input: Partial<ProfileInput> & { profilePicture?: string | null }) => updateMe(input),
    })
}
