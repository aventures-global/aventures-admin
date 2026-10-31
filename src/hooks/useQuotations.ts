import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    changeQuotationStatus,
    convertQuotation,
    createQuotation,
    createQuotationShare,
    deleteQuotation,
    generateQuotationPdf,
    getQuotation,
    listQuotationShares,
    listQuotations,
    revokeQuotationShare,
    updateQuotation,
    type QuotationCreateInput,
    type QuotationListParams,
    type QuotationStatusAction,
    type QuotationUpdateInput,
} from '../services/quotationService'

export const quotationKeys = {
    all: ['quotations'] as const,
    list: (params: QuotationListParams) => ['quotations', 'list', params] as const,
    detail: (id: string) => ['quotations', 'detail', id] as const,
    shares: (id: string) => ['quotations', 'shares', id] as const,
}

export function useQuotations(params: QuotationListParams, enabled = true) {
    return useQuery({
        queryKey: quotationKeys.list(params),
        queryFn: () => listQuotations(params),
        placeholderData: keepPreviousData,
        enabled,
    })
}

export function useQuotation(id: string | undefined, enabled = true) {
    return useQuery({
        queryKey: quotationKeys.detail(id ?? ''),
        queryFn: () => getQuotation(id!),
        enabled: Boolean(id) && enabled,
    })
}

export function useQuotationShares(id: string | null) {
    return useQuery({
        queryKey: quotationKeys.shares(id ?? ''),
        queryFn: () => listQuotationShares(id!),
        enabled: Boolean(id),
    })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
    void queryClient.invalidateQueries({ queryKey: quotationKeys.all })
}

export function useCreateQuotation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: QuotationCreateInput) => createQuotation(input),
        onSuccess: () => invalidateAll(queryClient),
    })
}

export function useUpdateQuotation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: QuotationUpdateInput }) =>
            updateQuotation(id, input),
        onSuccess: () => invalidateAll(queryClient),
    })
}

export function useChangeQuotationStatus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, action }: { id: string; action: QuotationStatusAction }) =>
            changeQuotationStatus(id, action),
        onSuccess: () => invalidateAll(queryClient),
    })
}

export function useGenerateQuotationPdf() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => generateQuotationPdf(id),
        onSuccess: () => invalidateAll(queryClient),
    })
}

export function useConvertQuotation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => convertQuotation(id),
        onSuccess: () => invalidateAll(queryClient),
    })
}

export function useDeleteQuotation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => deleteQuotation(id),
        onSuccess: () => invalidateAll(queryClient),
    })
}

export function useCreateQuotationShare() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            expiresInHours,
            maxViews,
        }: {
            id: string
            expiresInHours: 24 | 168 | 720
            maxViews?: number | null
        }) => createQuotationShare(id, { expiresInHours, maxViews }),
        onSuccess: (_data, vars) => {
            void queryClient.invalidateQueries({ queryKey: quotationKeys.shares(vars.id) })
            void queryClient.invalidateQueries({ queryKey: quotationKeys.detail(vars.id) })
        },
    })
}

export function useRevokeQuotationShare() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shareId }: { shareId: string; quotationId: string }) =>
            revokeQuotationShare(shareId),
        onSuccess: (_data, vars) => {
            void queryClient.invalidateQueries({ queryKey: quotationKeys.shares(vars.quotationId) })
            void queryClient.invalidateQueries({ queryKey: quotationKeys.detail(vars.quotationId) })
        },
    })
}
