import type { MerchCategory, MerchInput, MerchProduct } from '../types/merch'
import { api } from './api'

export async function listMerch(): Promise<MerchProduct[]> {
    const { data } = await api.get<MerchProduct[]>('/api/merch')
    return data
}

export async function getMerch(slug: string): Promise<MerchProduct> {
    const { data } = await api.get<MerchProduct>(`/api/merch/${encodeURIComponent(slug)}`)
    return data
}

export async function createMerch(input: MerchInput): Promise<MerchProduct> {
    const { data } = await api.post<MerchProduct>('/api/merch', input)
    return data
}

export async function updateMerch(slug: string, input: Partial<MerchInput>): Promise<MerchProduct> {
    const { data } = await api.patch<MerchProduct>(`/api/merch/${encodeURIComponent(slug)}`, input)
    return data
}

export async function deleteMerch(slug: string): Promise<void> {
    await api.delete(`/api/merch/${encodeURIComponent(slug)}`)
}

export async function listMerchCategories(): Promise<MerchCategory[]> {
    const { data } = await api.get<MerchCategory[]>('/api/merch/categories')
    return data
}

export async function createMerchCategory(name: string): Promise<MerchCategory> {
    const { data } = await api.post<MerchCategory>('/api/merch/categories', { name })
    return data
}

export async function renameMerchCategory(id: string, name: string): Promise<MerchCategory> {
    const { data } = await api.patch<MerchCategory>(`/api/merch/categories/${encodeURIComponent(id)}`, { name })
    return data
}

export async function deleteMerchCategory(id: string): Promise<void> {
    await api.delete(`/api/merch/categories/${encodeURIComponent(id)}`)
}

export async function reorderMerchCategories(ids: string[]): Promise<void> {
    await api.put('/api/merch/categories/order', { ids })
}
