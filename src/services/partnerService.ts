import { api } from './api'

export type Partner = {
    id: string
    name: string
    url: string
    description: string
    logoSrc: string
    sortOrder: number
}

export type PartnerInput = Pick<Partner, 'name' | 'url' | 'description' | 'logoSrc'>

export async function listPartners(): Promise<Partner[]> {
    const { data } = await api.get<Partner[]>('/api/partners')
    return data
}

export async function createPartner(input: PartnerInput): Promise<Partner> {
    const { data } = await api.post<Partner>('/api/partners', input)
    return data
}

export async function updatePartner(id: string, input: Partial<PartnerInput>): Promise<Partner> {
    const { data } = await api.patch<Partner>(`/api/partners/${encodeURIComponent(id)}`, input)
    return data
}

export async function deletePartner(id: string): Promise<void> {
    await api.delete(`/api/partners/${encodeURIComponent(id)}`)
}

export async function reorderPartners(ids: string[]): Promise<void> {
    await api.put('/api/partners/order', { ids })
}
