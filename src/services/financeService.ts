import { api } from './api'

export type FinanceEntryType = 'INCOME' | 'EXPENSE'

export type FinanceCategory = {
    id: string
    name: string
    type: FinanceEntryType
    isSystem: boolean
    sortOrder: number
    archivedAt: string | null
    createdAt: string
    updatedAt: string
}

export type FinanceEntry = {
    id: string
    type: FinanceEntryType
    categoryId: string
    category: FinanceCategory
    amountCents: number
    amount: string
    currency: string
    occurredAt: string
    description: string
    notes: string | null
    paymentId: string | null
    payment: {
        id: string
        bookingId: string
        customerUserId: string
        amountCents: number
        voidedAt: string | null
    } | null
    voidedAt: string | null
    voidReason: string | null
    createdAt: string
    updatedAt: string
}

export type FinanceEntryListParams = {
    q?: string
    type?: FinanceEntryType | 'all'
    categoryId?: string
    currency?: string
    from?: string
    to?: string
    includeVoided?: boolean
    page?: number
    limit?: number
}

export type FinanceEntryCreateInput = {
    type: FinanceEntryType
    categoryId: string
    amountCents: number
    currency?: string
    occurredAt?: string
    description: string
    notes?: string | null
}

export type FinanceSummary = {
    from: string | null
    to: string | null
    currency: string
    incomeCents: number
    income: string
    expenseCents: number
    expense: string
    netCents: number
    net: string
    byCategory: Array<{
        categoryId: string
        name: string
        type: FinanceEntryType
        count: number
        amountCents: number
        amount: string
    }>
}

export function listFinanceCategories(includeArchived = false) {
    return api
        .get<{ items: FinanceCategory[] }>('/api/admin/finance/categories', {
            params: includeArchived ? { includeArchived: 'true' } : undefined,
        })
        .then((res) => res.data.items)
}

export function createFinanceCategory(input: { name: string; type: FinanceEntryType; sortOrder?: number }) {
    return api.post<FinanceCategory>('/api/admin/finance/categories', input).then((res) => res.data)
}

export function updateFinanceCategory(
    id: string,
    input: { name?: string; sortOrder?: number; archived?: boolean },
) {
    return api.patch<FinanceCategory>(`/api/admin/finance/categories/${id}`, input).then((res) => res.data)
}

export function listFinanceEntries(params: FinanceEntryListParams = {}) {
    return api
        .get<{ items: FinanceEntry[]; total: number; page: number; limit: number }>(
            '/api/admin/finance/entries',
            {
                params: {
                    q: params.q ?? '',
                    type: params.type ?? 'all',
                    categoryId: params.categoryId,
                    currency: params.currency,
                    from: params.from,
                    to: params.to,
                    includeVoided: params.includeVoided ? 'true' : undefined,
                    page: params.page ?? 1,
                    limit: params.limit ?? 20,
                },
            },
        )
        .then((res) => res.data)
}

export function createFinanceEntry(input: FinanceEntryCreateInput) {
    return api.post<FinanceEntry>('/api/admin/finance/entries', input).then((res) => res.data)
}

export function voidFinanceEntry(id: string, reason?: string | null) {
    return api
        .post<FinanceEntry>(`/api/admin/finance/entries/${id}/void`, { reason: reason ?? null })
        .then((res) => res.data)
}

export function getFinanceSummary(params: { from?: string; to?: string; currency?: string } = {}) {
    return api.get<FinanceSummary>('/api/admin/finance/summary', { params }).then((res) => res.data)
}
