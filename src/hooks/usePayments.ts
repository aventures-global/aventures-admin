import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    createPayment,
    getPayment,
    getPaymentSummary,
    listPayments,
    updatePayment,
    voidPayment,
    type PaymentCreateInput,
    type PaymentListParams,
    type PaymentUpdateInput,
} from '../services/paymentService'
import { bookingKeys } from './useBookings'
import { financeKeys } from './useFinance'

export const paymentKeys = {
    all: ['payments'] as const,
    list: (params: PaymentListParams) => ['payments', 'list', params] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
    summary: (params: { from?: string; to?: string }) => ['payments', 'summary', params] as const,
}

function invalidateFinanceLinked(queryClient: ReturnType<typeof useQueryClient>) {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    void queryClient.invalidateQueries({ queryKey: financeKeys.all })
}

export function usePayments(params: PaymentListParams, enabled = true) {
    return useQuery({
        queryKey: paymentKeys.list(params),
        queryFn: () => listPayments(params),
        placeholderData: keepPreviousData,
        enabled,
    })
}

export function usePayment(id: string | undefined, enabled = true) {
    return useQuery({
        queryKey: paymentKeys.detail(id ?? ''),
        queryFn: () => getPayment(id!),
        enabled: Boolean(id) && enabled,
    })
}

export function usePaymentSummary(params: { from?: string; to?: string }, enabled = true) {
    return useQuery({
        queryKey: paymentKeys.summary(params),
        queryFn: () => getPaymentSummary(params),
        enabled,
    })
}

export function useCreatePayment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: PaymentCreateInput) => createPayment(input),
        onSuccess: () => invalidateFinanceLinked(queryClient),
    })
}

export function useUpdatePayment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: PaymentUpdateInput }) => updatePayment(id, input),
        onSuccess: () => invalidateFinanceLinked(queryClient),
    })
}

export function useVoidPayment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string | null }) => voidPayment(id, reason),
        onSuccess: () => invalidateFinanceLinked(queryClient),
    })
}
