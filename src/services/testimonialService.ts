import { api } from './api'

export type Testimonial = {
    id: string
    quote: string
    name: string
    trip: string
    rating: number
    sortOrder: number
}

export type TestimonialInput = Pick<Testimonial, 'quote' | 'name' | 'trip' | 'rating'>

export async function listTestimonials(): Promise<Testimonial[]> {
    const { data } = await api.get<Testimonial[]>('/api/testimonials')
    return data
}

export async function createTestimonial(input: TestimonialInput): Promise<Testimonial> {
    const { data } = await api.post<Testimonial>('/api/testimonials', input)
    return data
}

export async function updateTestimonial(id: string, input: Partial<TestimonialInput>): Promise<Testimonial> {
    const { data } = await api.patch<Testimonial>(`/api/testimonials/${encodeURIComponent(id)}`, input)
    return data
}

export async function deleteTestimonial(id: string): Promise<void> {
    await api.delete(`/api/testimonials/${encodeURIComponent(id)}`)
}

export async function reorderTestimonials(ids: string[]): Promise<void> {
    await api.put('/api/testimonials/order', { ids })
}
