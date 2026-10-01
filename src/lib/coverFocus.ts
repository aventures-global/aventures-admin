// Mirrors the per-tour crop positions hard-coded in the client so previews match the live site.

const cardFocus: Record<string, string> = {
    'philippine-discovery': 'object-[center_45%]',
    'cebu-tour': 'object-[35%_50%]',
    'boracay-serenity': 'object-[center_58%]',
    'south-korea-kwave': 'object-[center_45%]',
    'japan-tradition': 'object-[center_48%]',
    'usa-dream-big': 'object-[center_48%]',
    'thailand-calling': 'object-[center_45%]',
    'indonesia-escape': 'object-[center_48%]',
    'europe-journeys': 'object-[center_45%]',
}

const heroFocus: Record<string, string> = {
    'philippine-discovery': 'object-[center_48%]',
    'cebu-tour': 'object-[35%_55%]',
    'boracay-serenity': 'object-[center_58%]',
    'south-korea-kwave': 'object-[center_48%]',
    'japan-tradition': 'object-[center_50%]',
    'usa-dream-big': 'object-[center_50%]',
    'thailand-calling': 'object-[center_48%]',
    'indonesia-escape': 'object-[center_50%]',
    'europe-journeys': 'object-[center_48%]',
}

export function cardCoverFocus(id: string | undefined) {
    return (id && cardFocus[id]) || 'object-center'
}

export function heroCoverFocus(id: string | undefined) {
    return (id && heroFocus[id]) || 'object-center'
}
