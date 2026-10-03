import type { Faq, FaqAdminData, FaqInput, PublicFaqData } from '../types/faq'
import { api } from './api'

export async function getFaqAdminData(): Promise<FaqAdminData> {
    const { data } = await api.get<FaqAdminData>('/api/faqs/admin')
    return data
}

export async function getPublicFaqs(): Promise<PublicFaqData> {
    const { data } = await api.get<PublicFaqData>('/api/faqs')
    return data
}

export async function createFaqCategory(name: string): Promise<void> {
    await api.post('/api/faqs/categories', { name })
}

export async function renameFaqCategory(id: string, name: string): Promise<void> {
    await api.patch(`/api/faqs/categories/${encodeURIComponent(id)}`, { name })
}

export async function deleteFaqCategory(id: string): Promise<void> {
    await api.delete(`/api/faqs/categories/${encodeURIComponent(id)}`)
}

export async function reorderFaqCategories(ids: string[]): Promise<void> {
    await api.put('/api/faqs/categories/order', { ids })
}

export async function createFaq(input: FaqInput): Promise<Faq> {
    const { data } = await api.post<Faq>('/api/faqs', input)
    return data
}

export async function updateFaq(id: string, input: Partial<FaqInput>): Promise<Faq> {
    const { data } = await api.patch<Faq>(`/api/faqs/${encodeURIComponent(id)}`, input)
    return data
}

export async function deleteFaq(id: string): Promise<void> {
    await api.delete(`/api/faqs/${encodeURIComponent(id)}`)
}

export async function addTopFaq(faqId: string): Promise<void> {
    await api.post('/api/faqs/top', { faqId })
}

export async function removeTopFaq(faqId: string): Promise<void> {
    await api.delete(`/api/faqs/top/${encodeURIComponent(faqId)}`)
}
