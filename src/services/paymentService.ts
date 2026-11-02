import { api } from './api'
import type { Booking, BookingPaymentStatus } from './bookingService'

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'GCASH' | 'MAYA' | 'CARD' | 'STRIPE' | 'OTHER'

export type PaymentPerson = {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    profilePicture: string | null
    displayName: string
}

export type Payment = {
    id: string
    bookingId: string
    customerUserId: string
    customer: PaymentPerson | null
    amountCents: number
    amount: string
    currency: string
    method: PaymentMethod
    paidAt: string
    notes: string | null
    reference: string | null
    voidedAt: string | null
    voidReason: string | null
    voidedBy: PaymentPerson | null
    createdBy: PaymentPerson | null
    financeEntryId: string | null
    booking: {
        id: string
        title: string
        status: string
        paymentStatus: BookingPaymentStatus
        isOverdue: boolean
        totalCents: number
        total: string
        paidCents: number
        paid: string
        remainingCents: number
        remaining: string
        currency: string
        dueAt: string | null
        quotation: { id: string; number: string; title: string } | null
        customer: PaymentPerson | null
    }
    createdAt: string
    updatedAt: string
}

export type PaymentListParams = {
    q?: string
    customerUserId?: string
    bookingId?: string
    method?: PaymentMethod | 'all'
    from?: string
    to?: string
    includeVoided?: boolean
    page?: number
    limit?: number
}

export type PaymentCreateInput = {
    bookingId: string
    amountCents: number
    method: PaymentMethod
    paidAt?: string
    notes?: string | null
    reference?: string | null
}

export type PaymentUpdateInput = {
    amountCents?: number
    method?: PaymentMethod
    paidAt?: string
    notes?: string | null
    reference?: string | null
}

export type PaymentSummary = {
    from: string | null
    to: string | null
    collectedCents: number
    collected: string
    paymentCount: number
    byMethod: Array<{ method: PaymentMethod; count: number; amountCents: number; amount: string }>
    byPaymentStatus: Record<string, number>
    overdueCount: number
    outstandingCents: number
    outstanding: string
}

export const METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank transfer',
    GCASH: 'GCash',
    MAYA: 'Maya',
    CARD: 'Card',
    STRIPE: 'Stripe',
    OTHER: 'Other',
}

/** Manual recording only — Stripe payments are created by Checkout webhooks. */
export const MANUAL_PAYMENT_METHODS = (
    Object.keys(METHOD_LABELS) as PaymentMethod[]
).filter((method) => method !== 'STRIPE')

export function listPayments(params: PaymentListParams = {}) {
    return api
        .get<{ items: Payment[]; total: number; page: number; limit: number }>('/api/admin/payments', {
            params: {
                q: params.q ?? '',
                customerUserId: params.customerUserId,
                bookingId: params.bookingId,
                method: params.method ?? 'all',
                from: params.from,
                to: params.to,
                includeVoided: params.includeVoided ? 'true' : undefined,
                page: params.page ?? 1,
                limit: params.limit ?? 20,
            },
        })
        .then((res) => res.data)
}

export function getPayment(id: string) {
    return api.get<Payment>(`/api/admin/payments/${id}`).then((res) => res.data)
}

export function createPayment(input: PaymentCreateInput) {
    return api.post<Payment>('/api/admin/payments', input).then((res) => res.data)
}

export function updatePayment(id: string, input: PaymentUpdateInput) {
    return api.patch<Payment>(`/api/admin/payments/${id}`, input).then((res) => res.data)
}

export function voidPayment(id: string, reason?: string | null) {
    return api.post<Payment>(`/api/admin/payments/${id}/void`, { reason: reason ?? null }).then((res) => res.data)
}

export function getPaymentSummary(params: { from?: string; to?: string } = {}) {
    return api.get<PaymentSummary>('/api/admin/payments/summary', { params }).then((res) => res.data)
}

export async function downloadPaymentsCsv(params: PaymentListParams = {}, filename = 'payments.csv') {
    const res = await api.get('/api/admin/payments/export.csv', {
        params: {
            q: params.q ?? '',
            customerUserId: params.customerUserId,
            bookingId: params.bookingId,
            method: params.method ?? 'all',
            from: params.from,
            to: params.to,
            includeVoided: params.includeVoided ? 'true' : undefined,
        },
        responseType: 'blob',
    })
    const url = URL.createObjectURL(res.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

export function centsFromMajor(value: string): number {
    const match = value.replace(/,/g, '').match(/(\d+(?:\.\d{0,2})?)/)
    if (!match) return 0
    return Math.round(Number(match[1]) * 100)
}

export function majorFromCents(cents: number): string {
    return (cents / 100).toFixed(2)
}

export type { Booking }
