// Mirrors client/src/data/destinationContent.ts so new destinations start with the public page's copy.

export const EXPERIENCE_CATEGORIES = [
    { label: 'See', summary: 'Landmarks, scenery, architecture, and views that define the destination.' },
    { label: 'Taste', summary: 'Local flavors, markets, cafés, and dining experiences worth seeking out.' },
    { label: 'Experience', summary: 'Activities and attractions that bring you closer to the place.' },
    { label: 'Discover', summary: 'Culture, traditions, and everyday moments beyond the familiar routes.' },
    { label: 'Explore', summary: 'Neighborhoods, streets, and local corners best found at your own pace.' },
] as const

export const STORY_COUNT = 3

export const DEFAULT_EXPERIENCE_BODY =
    'A signature story about this place—from a local recommendation and cultural detail to the moments that make this experience distinct from anywhere else.'

export const DEFAULT_TRAVEL_TIPS = [
    'Give yourself time to experience this destination without rushing.',
    'Pack for the weather, local customs, and the activities you want to try.',
    'Keep digital and printed copies of important travel documents.',
    'Leave room for local recommendations and unplanned discoveries.',
]
