import type {
    FinderOption,
    VisaChecklist,
    VisaFinder,
    VisaFinderInput,
    VisaService,
    VisaServiceInput,
} from '../types/visa'

function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys)
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.keys(value)
                .sort()
                .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
        )
    }
    return value
}

/** Compares a draft against saved data. Key order is ignored because the database reorders JSON keys. */
export function isSame(a: unknown, b: unknown) {
    return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))
}

/** Trims text and drops blank items and empty groups before saving. */
export function cleanChecklist(checklist: VisaChecklist): VisaChecklist {
    return {
        tagline: checklist.tagline.trim(),
        intro: checklist.intro.trim(),
        reminder: checklist.reminder.trim(),
        groups: checklist.groups
            .map((group) => ({
                title: group.title.trim(),
                items: group.items.map((item) => item.trim()).filter(Boolean),
            }))
            .filter((group) => group.title || group.items.length > 0),
    }
}

export function toServiceInput(service: VisaService): VisaServiceInput {
    return {
        title: service.title,
        shortLabel: service.shortLabel,
        description: service.description,
        anchor: service.anchor,
        category: service.category,
        askVisaType: service.askVisaType,
        faqCategoryId: service.faqCategoryId,
        introFaqId: service.introFaqId,
        qualifyFaqId: service.qualifyFaqId,
        checklist: service.checklist,
        checklistPdf: service.checklistPdf,
    }
}

export function cleanService(input: VisaServiceInput): VisaServiceInput {
    return {
        ...input,
        title: input.title.trim(),
        shortLabel: input.shortLabel.trim(),
        description: input.description.trim(),
        anchor: input.anchor.trim(),
        category: input.category.trim(),
        checklist: cleanChecklist(input.checklist),
        checklistPdf: {
            href: input.checklistPdf.href.trim(),
            downloadName: input.checklistPdf.downloadName.trim(),
        },
    }
}

/** First problem that would stop this visa from saving, in plain words. */
export function serviceProblem(name: string, input: VisaServiceInput): string | null {
    if (!input.title || !input.description) return `${name}: add a title and a description.`
    if (!input.shortLabel || !input.category) return `${name}: the short label and card category can’t be empty.`
    if (!/^[a-z0-9-]+$/.test(input.anchor)) {
        return `${name}: the section id uses lowercase letters, numbers, and dashes only.`
    }
    if (!input.checklist.tagline || !input.checklist.reminder) {
        return `${name}: the checklist needs a tagline and a reminder.`
    }
    if (input.checklist.groups.length === 0) return `${name}: the checklist needs at least one group.`
    if (input.checklist.groups.some((group) => !group.title || group.items.length === 0)) {
        return `${name}: every checklist group needs a title and at least one item.`
    }
    if (!input.checklistPdf.href || !input.checklistPdf.downloadName) {
        return `${name}: the printable checklist needs a PDF and a file name.`
    }
    return null
}

export function toFinderInput(finder: VisaFinder): VisaFinderInput {
    return {
        eyebrow: finder.eyebrow,
        heading: finder.heading,
        disclaimer: finder.disclaimer,
        purpose: {
            title: finder.purpose.title,
            options: finder.purpose.options.map(({ id, label }) => ({ id, label })),
        },
        roles: finder.roles,
        readiness: finder.readiness,
        notes: finder.notes,
        touristNotes: finder.touristNotes,
        exploreLinks: finder.exploreLinks.map(({ id, label, note }) => ({ id, label, note })),
    }
}

function mapValues<K extends string, V>(record: Record<K, V>, fn: (value: V) => V): Record<K, V> {
    return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, fn(value as V)])) as Record<K, V>
}

export function cleanFinder(finder: VisaFinder): VisaFinder {
    const trim = (value: string) => value.trim()
    return {
        ...finder,
        eyebrow: trim(finder.eyebrow),
        heading: trim(finder.heading),
        disclaimer: trim(finder.disclaimer),
        purpose: {
            title: trim(finder.purpose.title),
            options: finder.purpose.options.map((o) => ({ ...o, label: trim(o.label) })),
        },
        roles: mapValues(finder.roles, (q) => ({
            title: trim(q.title),
            options: q.options.map((o) => ({ ...o, label: trim(o.label) })),
        })),
        readiness: mapValues(finder.readiness, (q) => ({
            title: trim(q.title),
            options: q.options.map((o) => ({ ...o, label: trim(o.label) })),
        })),
        notes: mapValues(finder.notes, trim),
        touristNotes: mapValues(finder.touristNotes, trim),
        exploreLinks: finder.exploreLinks.map((l) => ({ ...l, label: trim(l.label), note: trim(l.note) })),
    }
}

export function finderHasBlank(finder: VisaFinder) {
    const texts = [
        finder.eyebrow,
        finder.heading,
        finder.disclaimer,
        finder.purpose.title,
        ...finder.purpose.options.map((o) => o.label),
        ...Object.values(finder.roles).flatMap((q) => [q.title, ...q.options.map((o) => o.label)]),
        ...Object.values(finder.readiness).flatMap((q) => [q.title, ...q.options.map((o) => o.label)]),
        ...Object.values(finder.notes),
        ...Object.values(finder.touristNotes),
        ...finder.exploreLinks.flatMap((l) => [l.label, l.note]),
    ]
    return texts.some((text) => !text)
}

/** Adds a blank answer, keeping a trailing “not sure” answer last. */
export function withNewOption(options: FinderOption[]): { options: FinderOption[]; id: string } {
    const used = new Set(options.map((o) => o.id))
    let n = options.length + 1
    while (used.has(`answer-${n}`)) n += 1
    const option: FinderOption = { id: `answer-${n}`, label: '', visa: null }
    const last = options.at(-1)
    return {
        id: option.id,
        options: last?.id === 'unsure' ? [...options.slice(0, -1), option, last] : [...options, option],
    }
}
