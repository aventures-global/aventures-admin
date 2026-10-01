import type { Tour, TourInput } from '../types/tour'

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const EMPTY_TOUR: TourInput = {
    slug: '',
    title: '',
    tagline: '',
    shortDescription: '',
    coverImage: '',
    gallery: [],
    duration: '',
    startingPrice: '',
    location: '',
    highlights: [],
    itinerary: [],
    inclusions: [],
    exclusions: [],
    featured: false,
    region: 'other',
}

export function toDraft(tour: Tour): TourInput {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, sortOrder, updatedAt, ...input } = tour
    return input
}

export function slugify(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function cleanList(items: string[]): string[] {
    return items.map((item) => item.trim()).filter(Boolean)
}

export function cleanDraft(draft: TourInput): TourInput {
    return {
        ...draft,
        slug: draft.slug.trim(),
        title: draft.title.trim(),
        tagline: draft.tagline.trim(),
        shortDescription: draft.shortDescription.trim(),
        coverImage: draft.coverImage.trim(),
        duration: draft.duration.trim(),
        startingPrice: draft.startingPrice.trim(),
        location: draft.location.trim(),
        gallery: cleanList(draft.gallery),
        highlights: cleanList(draft.highlights),
        inclusions: cleanList(draft.inclusions),
        exclusions: cleanList(draft.exclusions),
        itinerary: draft.itinerary.map((day, index) => ({
            day: index + 1,
            title: day.title.trim(),
            description: day.description.trim(),
        })),
    }
}

export type DraftField = keyof TourInput

const REQUIRED: { field: DraftField; label: string }[] = [
    { field: 'title', label: 'Title' },
    { field: 'tagline', label: 'Tagline' },
    { field: 'coverImage', label: 'Cover image' },
    { field: 'location', label: 'Location' },
    { field: 'duration', label: 'Duration' },
    { field: 'startingPrice', label: 'Price' },
    { field: 'shortDescription', label: 'Short description' },
]

export type DraftErrors = {
    fields: Partial<Record<DraftField, string>>
    messages: string[]
}

export function validateDraft(draft: TourInput): DraftErrors {
    const fields: DraftErrors['fields'] = {}

    for (const { field, label } of REQUIRED) {
        if (!String(draft[field]).trim()) fields[field] = `${label} is required`
    }

    const slug = draft.slug.trim()
    if (!slug) fields.slug = 'URL slug is required'
    else if (!SLUG_PATTERN.test(slug)) {
        fields.slug = 'URL slug can only use lowercase letters, numbers, and single hyphens'
    } else if (slug === 'search') {
        fields.slug = 'This URL slug is reserved'
    }

    const messages = Object.values(fields)
    if (draft.itinerary.some((day) => !day.title.trim() || !day.description.trim())) {
        fields.itinerary = 'Every itinerary day needs a title and description'
        messages.push(fields.itinerary)
    }

    return { fields, messages }
}
