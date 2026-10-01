import type { Tour, TourInput, TourSearchPage, TourSearchParams } from '../types/tour'
import { api } from './api'

export const TOUR_PAGE_SIZE = 12

export async function searchTours(
    params: TourSearchParams,
    cursor: number,
    limit = TOUR_PAGE_SIZE,
): Promise<TourSearchPage> {
    const { data } = await api.get<TourSearchPage>('/api/tours/search', {
        params: {
            q: params.q || undefined,
            region: params.region,
            featured: params.featured ? 'true' : undefined,
            sort: params.sort,
            dir: params.dir,
            cursor,
            limit,
        },
    })
    return data
}

export type TourMove = { beforeSlug?: string; afterSlug?: string }

export async function moveTour(slug: string, move: TourMove): Promise<Tour> {
    const { data } = await api.post<Tour>(`/api/tours/${encodeURIComponent(slug)}/move`, move)
    return data
}

export async function listTours(): Promise<Tour[]> {
    const { data } = await api.get<Tour[]>('/api/tours')
    return data
}

export async function getTour(slug: string): Promise<Tour> {
    const { data } = await api.get<Tour>(`/api/tours/${encodeURIComponent(slug)}`)
    return data
}

export async function createTour(input: TourInput): Promise<Tour> {
    const { data } = await api.post<Tour>('/api/tours', input)
    return data
}

export async function updateTour(slug: string, input: Partial<TourInput>): Promise<Tour> {
    const { data } = await api.patch<Tour>(`/api/tours/${encodeURIComponent(slug)}`, input)
    return data
}

export async function deleteTour(slug: string): Promise<void> {
    await api.delete(`/api/tours/${encodeURIComponent(slug)}`)
}
