import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    createFinanceCategory,
    createFinanceEntry,
    getFinanceSummary,
    listFinanceCategories,
    listFinanceEntries,
    voidFinanceEntry,
    type FinanceEntryCreateInput,
    type FinanceEntryListParams,
    type FinanceEntryType,
} from '../services/financeService'

export const financeKeys = {
    all: ['finance'] as const,
    categories: (includeArchived = false) => ['finance', 'categories', includeArchived] as const,
    entries: (params: FinanceEntryListParams) => ['finance', 'entries', params] as const,
    summary: (params: { from?: string; to?: string; currency?: string }) =>
        ['finance', 'summary', params] as const,
}

export function useFinanceCategories(includeArchived = false, enabled = true) {
    return useQuery({
        queryKey: financeKeys.categories(includeArchived),
        queryFn: () => listFinanceCategories(includeArchived),
        enabled,
    })
}

export function useFinanceEntries(params: FinanceEntryListParams, enabled = true) {
    return useQuery({
        queryKey: financeKeys.entries(params),
        queryFn: () => listFinanceEntries(params),
        placeholderData: keepPreviousData,
        enabled,
    })
}

export function useFinanceSummary(
    params: { from?: string; to?: string; currency?: string },
    enabled = true,
) {
    return useQuery({
        queryKey: financeKeys.summary(params),
        queryFn: () => getFinanceSummary(params),
        enabled,
    })
}

export function useCreateFinanceEntry() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: FinanceEntryCreateInput) => createFinanceEntry(input),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: financeKeys.all }),
    })
}

export function useVoidFinanceEntry() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string | null }) => voidFinanceEntry(id, reason),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: financeKeys.all }),
    })
}

export function useCreateFinanceCategory() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: { name: string; type: FinanceEntryType; sortOrder?: number }) =>
            createFinanceCategory(input),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: financeKeys.categories() }),
    })
}
