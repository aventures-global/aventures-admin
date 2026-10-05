import type {
    VisaCatalog,
    VisaFinderInput,
    VisaId,
    VisaPageInput,
    VisaPageSlug,
    VisaServiceInput,
} from '../types/visa'
import { api } from './api'

export async function getVisaCatalog(): Promise<VisaCatalog> {
    const { data } = await api.get<VisaCatalog>('/api/visa')
    return data
}

export async function updateVisaPage(slug: VisaPageSlug, input: VisaPageInput): Promise<VisaCatalog> {
    const { data } = await api.patch<VisaCatalog>(`/api/visa/pages/${encodeURIComponent(slug)}`, input)
    return data
}

export async function updateVisaService(id: VisaId, input: Partial<VisaServiceInput>): Promise<VisaCatalog> {
    const { data } = await api.patch<VisaCatalog>(`/api/visa/services/${encodeURIComponent(id)}`, input)
    return data
}

export async function updateVisaFinder(input: VisaFinderInput): Promise<VisaCatalog> {
    const { data } = await api.patch<VisaCatalog>('/api/visa/finder', input)
    return data
}
