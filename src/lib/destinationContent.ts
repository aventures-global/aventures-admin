// Mirrors client/src/data/destinationContent.ts so new destinations start with the public page's copy.

/** Eyebrows of the fixed sections used before they became editable; fills sections saved without one. */
export const LEGACY_EXPERIENCE_EYEBROWS = ['See', 'Taste', 'Experience', 'Discover', 'Explore'] as const

export const STORY_COUNT = 3

export const EMPTY_EXPERIENCE = { eyebrow: '', headline: '', summary: '', body: '', image: '' }

export const DEFAULT_TRAVEL_TIPS = [
    'Give yourself time to experience this destination without rushing.',
    'Pack for the weather, local customs, and the activities you want to try.',
    'Keep digital and printed copies of important travel documents.',
    'Leave room for local recommendations and unplanned discoveries.',
]
