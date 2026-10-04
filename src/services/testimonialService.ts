import { api } from './api'

export type Testimonial = {
    id: string
    quote: string
    name: string
    trip: string
    rating: number
}

export async function listTestimonials(): Promise<Testimonial[]> {
    const { data } = await api.get<Testimonial[]>('/api/testimonials')
    return data
}
