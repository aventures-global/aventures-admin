import { api } from './api'

export type BookingPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID'

export type BookingPerson = {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    profilePicture: string | null
    displayName: string
}

export type Booking = {
    id: string
    customerUserId: string | null
    customer: BookingPerson | null
    quotationId: string | null
    quotation: {
        id: string
        number: string
        title: string
        status?: string
        customerName?: string
        customerEmail?: string
    } | null
    status: string
    paymentStatus: BookingPaymentStatus
    isOverdue: boolean
    paidCents: number
    paid: string
    remainingCents: number
    remaining: string
    totalCents: number
    total: string
    currency: string
    title: string
    notes: string | null
    dueAt: string | null
    createdAt: string
    updatedAt: string
    payments?: Array<{
        id: string
        amountCents: number
        amount: string
        currency: string
        method: string
        paidAt: string
        notes: string | null
        reference: string | null
        voidedAt: string | null
        voidReason: string | null
        createdAt: string
    }>
}

export type BookingPaymentStatusFilter = BookingPaymentStatus | 'open' | 'all'

export type BookingListParams = {
    q?: string
    customerUserId?: string
    paymentStatus?: BookingPaymentStatusFilter
    page?: number
    limit?: number
}

export const PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
    UNPAID: 'Unpaid',
    PARTIAL: 'Partial',
    PAID: 'Paid',
    OVERPAID: 'Overpaid',
}

export function listBookings(params: BookingListParams = {}) {
    return api
        .get<{ items: Booking[]; total: number; page: number; limit: number }>('/api/admin/bookings', {
            params: {
                q: params.q ?? '',
                customerUserId: params.customerUserId,
                paymentStatus: params.paymentStatus ?? 'all',
                page: params.page ?? 1,
                limit: params.limit ?? 20,
            },
        })
        .then((res) => res.data)
}

export function getBooking(id: string) {
    return api.get<Booking>(`/api/admin/bookings/${id}`).then((res) => res.data)
}

export function updateBooking(id: string, input: { dueAt?: string | null; notes?: string | null }) {
    return api.patch<Booking>(`/api/admin/bookings/${id}`, input).then((res) => res.data)
}
