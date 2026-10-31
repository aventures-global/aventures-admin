import { api } from './api'

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CONVERTED'
export type QuotationItemKind = 'SERVICE' | 'PACKAGE' | 'OPTIONAL' | 'OTHER'
export type QuotationStatusAction = 'send' | 'accept' | 'decline' | 'expire'

export type QuotationPerson = {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    displayName: string
}

export type QuotationItem = {
    id?: string
    kind: QuotationItemKind
    title: string
    description: string | null
    quantity: number
    unitCents: number
    lineCents: number
    isOptional: boolean
    selected: boolean
    sortOrder: number
}

export type QuotationShare = {
    id: string
    expiresAt: string
    revokedAt: string | null
    viewCount: number
    maxViews: number | null
    createdAt: string
    token?: string
    url?: string
}

export type Quotation = {
    id: string
    number: string
    status: QuotationStatus
    currency: string
    title: string
    notes: string | null
    customerMessage: string | null
    validUntil: string | null
    subtotalCents: number
    optionalCents: number
    totalCents: number
    subtotal: string
    optional: string
    total: string
    customer: QuotationPerson | null
    createdBy: QuotationPerson | null
    updatedBy: QuotationPerson | null
    sentAt: string | null
    acceptedAt: string | null
    declinedAt: string | null
    convertedAt: string | null
    hasPdf: boolean
    booking: {
        id: string
        status: string
        title: string
        totalCents: number
        currency: string
        total: string
    } | null
    items: QuotationItem[]
    shares: QuotationShare[]
    createdAt: string
    updatedAt: string
}

export type QuotationListParams = {
    q?: string
    status?: QuotationStatus | 'all'
    customerUserId?: string
    page?: number
    limit?: number
}

export type QuotationItemInput = {
    kind: QuotationItemKind
    title: string
    description?: string | null
    quantity: number
    unitCents: number
    isOptional?: boolean
    selected?: boolean
    sortOrder?: number
}

export type QuotationCreateInput = {
    customerUserId: string
    title: string
    currency?: string
    notes?: string | null
    customerMessage?: string | null
    validUntil?: string | null
    items: QuotationItemInput[]
}

export type QuotationUpdateInput = {
    title?: string
    currency?: string
    notes?: string | null
    customerMessage?: string | null
    validUntil?: string | null
    items?: QuotationItemInput[]
}

export const STATUS_LABELS: Record<QuotationStatus, string> = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
    EXPIRED: 'Expired',
    CONVERTED: 'Converted',
}

export const KIND_LABELS: Record<QuotationItemKind, string> = {
    SERVICE: 'Service',
    PACKAGE: 'Package',
    OPTIONAL: 'Optional',
    OTHER: 'Other',
}

export function listQuotations(params: QuotationListParams = {}) {
    return api.get<{ items: Quotation[]; total: number; page: number; limit: number }>(
        '/api/admin/quotations',
        { params },
    ).then((res) => res.data)
}

export function getQuotation(id: string) {
    return api.get<{ quotation: Quotation }>(`/api/admin/quotations/${id}`).then((res) => res.data)
}

export function createQuotation(input: QuotationCreateInput) {
    return api.post<{ quotation: Quotation }>('/api/admin/quotations', input).then((res) => res.data)
}

export function updateQuotation(id: string, input: QuotationUpdateInput) {
    return api
        .patch<{ quotation: Quotation }>(`/api/admin/quotations/${id}`, input)
        .then((res) => res.data)
}

export function changeQuotationStatus(id: string, action: QuotationStatusAction) {
    return api
        .post<{ quotation: Quotation }>(`/api/admin/quotations/${id}/status`, { action })
        .then((res) => res.data)
}

export function generateQuotationPdf(id: string) {
    return api.post<{ quotation: Quotation }>(`/api/admin/quotations/${id}/pdf`).then((res) => res.data)
}

export async function downloadQuotationPdf(id: string, filename: string) {
    const res = await api.get(`/api/admin/quotations/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

export function listQuotationShares(id: string) {
    return api
        .get<{ shares: QuotationShare[] }>(`/api/admin/quotations/${id}/shares`)
        .then((res) => res.data.shares)
}

export function createQuotationShare(
    id: string,
    input: { expiresInHours: 24 | 168 | 720; maxViews?: number | null },
) {
    return api
        .post<{ share: QuotationShare }>(`/api/admin/quotations/${id}/shares`, input)
        .then((res) => res.data)
}

export function revokeQuotationShare(shareId: string) {
    return api.post<{ ok: true }>(`/api/admin/quotations/shares/${shareId}/revoke`).then((res) => res.data)
}

export function convertQuotation(id: string) {
    return api
        .post<{ quotation: Quotation; booking: { id: string } }>(`/api/admin/quotations/${id}/convert`)
        .then((res) => res.data)
}

export function deleteQuotation(id: string) {
    return api.delete<{ ok: true }>(`/api/admin/quotations/${id}`).then((res) => res.data)
}

export function centsFromMajor(value: string): number {
    const match = value.replace(/,/g, '').match(/(\d+(?:\.\d{0,2})?)/)
    if (!match) return 0
    return Math.round(Number(match[1]) * 100)
}

export function majorFromCents(cents: number): string {
    return (cents / 100).toFixed(2)
}
