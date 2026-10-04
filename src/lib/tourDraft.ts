import type { Tour, TourInput } from '../types/tour'
import {
    DEFAULT_EXPERIENCE_BODY,
    DEFAULT_TRAVEL_TIPS,
    EXPERIENCE_CATEGORIES,
    STORY_COUNT,
} from './destinationContent'

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const EMPTY_TOUR: TourInput = {
    slug: '',
    title: '',
    tagline: '',
    shortDescription: '',
    coverImage: '',
    location: '',
    experiences: EXPERIENCE_CATEGORIES.map((category) => ({
        headline: '',
        summary: category.summary,
        body: DEFAULT_EXPERIENCE_BODY,
        image: '',
    })),
    storyTitles: Array.from({ length: STORY_COUNT }, () => ''),
    travelTips: [...DEFAULT_TRAVEL_TIPS],
    featured: false,
    region: 'other',
}

export function toDraft(tour: Tour): TourInput {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, sortOrder, updatedAt, ...input } = tour
    return {
        ...input,
        experiences: EMPTY_TOUR.experiences.map((empty, index) => ({ ...empty, ...input.experiences[index] })),
        storyTitles: EMPTY_TOUR.storyTitles.map((empty, index) => input.storyTitles[index] ?? empty),
        travelTips: EMPTY_TOUR.travelTips.map((empty, index) => input.travelTips[index] ?? empty),
    }
}

export function slugify(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function cleanDraft(draft: TourInput): TourInput {
    return {
        ...draft,
        slug: draft.slug.trim(),
        title: draft.title.trim(),
        tagline: draft.tagline.trim(),
        shortDescription: draft.shortDescription.trim(),
        coverImage: draft.coverImage.trim(),
        location: draft.location.trim(),
        experiences: draft.experiences.map((experience) => ({
            headline: experience.headline.trim(),
            summary: experience.summary.trim(),
            body: experience.body.trim(),
            image: experience.image.trim(),
        })),
        storyTitles: draft.storyTitles.map((title) => title.trim()),
        travelTips: draft.travelTips.map((tip) => tip.trim()),
    }
}

export type DraftField = keyof TourInput

const REQUIRED: { field: DraftField; label: string }[] = [
    { field: 'title', label: 'Title' },
    { field: 'tagline', label: 'Tagline' },
    { field: 'coverImage', label: 'Cover image' },
    { field: 'location', label: 'Location' },
    { field: 'shortDescription', label: 'SEO description' },
]

export type DraftErrors = {
    fields: Partial<Record<DraftField, string>>
    /** Keys like `headline-0` for experience fields, `story-1`, `tip-2`. */
    items: Set<string>
    messages: string[]
}

export function validateDraft(draft: TourInput): DraftErrors {
    const fields: DraftErrors['fields'] = {}
    const items = new Set<string>()

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

    draft.experiences.forEach((experience, index) => {
        const label = EXPERIENCE_CATEGORIES[index]?.label ?? `Section ${index + 1}`
        const missing = (['image', 'headline', 'summary', 'body'] as const).filter(
            (key) => !experience[key].trim(),
        )
        for (const key of missing) items.add(`${key}-${index}`)
        if (missing.length > 0) {
            fields.experiences = 'Experience sections are incomplete'
            messages.push(`${label} needs ${missing.join(', ')}`)
        }
    })

    draft.storyTitles.forEach((title, index) => {
        if (!title.trim()) items.add(`story-${index}`)
    })
    if (draft.storyTitles.some((title) => !title.trim())) {
        fields.storyTitles = 'Every story card needs a title'
        messages.push(fields.storyTitles)
    }

    draft.travelTips.forEach((tip, index) => {
        if (!tip.trim()) items.add(`tip-${index}`)
    })
    if (draft.travelTips.some((tip) => !tip.trim())) {
        fields.travelTips = 'Every travel tip needs text'
        messages.push(fields.travelTips)
    }

    return { fields, items, messages }
}
