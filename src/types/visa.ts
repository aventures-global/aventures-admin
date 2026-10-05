export type VisaId = 'tourist' | 'fiance' | 'k2' | 'j1' | 'r1' | 'r2' | 'p1' | 'p2' | 'e2'

export type VisaPageSlug = 'tourist' | 'k1-k2' | 'j1' | 'r1-r2' | 'p1-p2' | 'e2'

export type PathId = 'visiting' | 'fiance' | 'exchange' | 'religious' | 'performance' | 'investing'

export type Readiness = 'yes' | 'arranging' | 'no' | 'unsure'

export const READINESS_ORDER: Readiness[] = ['yes', 'arranging', 'no', 'unsure']

export const ASK_VISA_TYPES = [
    'U.S. Tourist Visa',
    'U.S. Fiancé(e) Visa',
    'U.S. K-2 Visa',
    'U.S. J-1 Exchange Visitor Visa',
    'U.S. R-1 Religious Worker Visa',
    'U.S. R-2 Dependent Visa',
    'U.S. P-1 Visa',
    'U.S. P-2 Visa',
    'U.S. E-2 Treaty Investor Visa',
] as const

export type VisaChecklistGroup = {
    title: string
    items: string[]
}

export type VisaChecklist = {
    tagline: string
    intro: string
    groups: VisaChecklistGroup[]
    reminder: string
}

export type VisaService = {
    id: VisaId
    title: string
    shortLabel: string
    description: string
    anchor: string
    category: string
    askVisaType: string
    faqCategoryId: string | null
    faqCategory: string
    introFaqId: string | null
    introQuestion: string
    qualifyFaqId: string | null
    qualifyQuestion: string
    checklist: VisaChecklist
    checklistPdf: { href: string; downloadName: string }
}

export type VisaPage = {
    slug: VisaPageSlug
    title: string
    description: string
    visas: VisaId[]
}

export type FinderOption = {
    id: string
    label: string
    visa: VisaId | null
}

export type VisaFinder = {
    eyebrow: string
    heading: string
    disclaimer: string
    purpose: { title: string; options: { id: string; label: string; path: PathId | null }[] }
    roles: Record<PathId, { title: string; options: FinderOption[] }>
    readiness: Record<VisaId, { title: string; options: { id: Readiness; label: string }[] }>
    notes: Record<Readiness, string>
    touristNotes: Record<Readiness, string>
    exploreLinks: { id: 'tours' | 'ask'; label: string; note: string; href: string }[]
}

export type VisaCatalog = {
    pages: VisaPage[]
    services: VisaService[]
    finder: VisaFinder
}

export type VisaPageInput = Pick<VisaPage, 'title' | 'description'>

export type VisaServiceInput = Pick<
    VisaService,
    | 'title'
    | 'shortLabel'
    | 'description'
    | 'anchor'
    | 'category'
    | 'askVisaType'
    | 'faqCategoryId'
    | 'introFaqId'
    | 'qualifyFaqId'
    | 'checklist'
    | 'checklistPdf'
>

export type VisaFinderInput = {
    eyebrow: string
    heading: string
    disclaimer: string
    purpose: { title: string; options: { id: string; label: string }[] }
    roles: VisaFinder['roles']
    readiness: VisaFinder['readiness']
    notes: VisaFinder['notes']
    touristNotes: VisaFinder['touristNotes']
    exploreLinks: { id: 'tours' | 'ask'; label: string; note: string }[]
}
