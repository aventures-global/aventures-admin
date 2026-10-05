export type TourExperience = {
    eyebrow: string
    headline: string
    summary: string
    body: string
    image: string
}

export type TourRegion =
    | 'philippines'
    | 'east-asia'
    | 'southeast-asia'
    | 'americas'
    | 'europe'
    | 'other'

export const REGION_OPTIONS: { id: TourRegion; label: string }[] = [
    { id: 'philippines', label: 'Philippines' },
    { id: 'east-asia', label: 'East Asia' },
    { id: 'southeast-asia', label: 'Southeast Asia' },
    { id: 'americas', label: 'USA' },
    { id: 'europe', label: 'Europe' },
    { id: 'other', label: 'Other' },
]

export function regionLabel(region: TourRegion): string {
    return REGION_OPTIONS.find((option) => option.id === region)?.label ?? 'Other'
}

export type Tour = {
    id: string
    slug: string
    title: string
    tagline: string
    shortDescription: string
    coverImage: string
    location: string
    experiences: TourExperience[]
    storyTitles: string[]
    travelTips: string[]
    featured: boolean
    region: TourRegion
    sortOrder: number
    updatedAt: string
}

export type TourInput = Omit<Tour, 'id' | 'sortOrder' | 'updatedAt'>

export type TourSort = 'custom' | 'name' | 'location' | 'region' | 'featured' | 'updated'

export type TourSearchParams = {
    q: string
    region: TourRegion | 'all'
    featured: boolean
    sort: TourSort
    dir: 'asc' | 'desc'
}

export type TourSummary = Pick<
    Tour,
    'id' | 'slug' | 'title' | 'tagline' | 'coverImage' | 'location' | 'featured' | 'region' | 'sortOrder' | 'updatedAt'
>

export type TourSearchPage = {
    items: TourSummary[]
    nextCursor: number | null
    total: number
}
