import type { LegalPageContent, SitePageContentMap, SitePageId } from '../types/sitePages'

export const SITE_PAGES: { id: SitePageId; label: string; path: string; description: string }[] = [
    { id: 'home', label: 'Homepage', path: '/', description: 'Hero, the AVENTURES story blurb, and the Why AVENTURES band.' },
    { id: 'about', label: 'About', path: '/about/why-us', description: 'Why Us, Behind the Dream, Origin, and Trust and Transparency tabs.' },
    { id: 'privacy', label: 'Privacy Policy', path: '/privacy', description: 'Intro, sections, and last-updated date.' },
    { id: 'terms', label: 'Terms & Conditions', path: '/terms', description: 'Intro, sections, and last-updated date.' },
]

export function isSitePageId(value: string | undefined): value is SitePageId {
    return SITE_PAGES.some((page) => page.id === value)
}

export function sitePageMeta(id: SitePageId) {
    return SITE_PAGES.find((page) => page.id === id)!
}

function slugify(text: string) {
    return text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
}

function trimDeep<T>(value: T): T {
    if (typeof value === 'string') return value.trim() as T
    if (Array.isArray(value)) return value.map(trimDeep) as T
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, trimDeep(v)])) as T
    }
    return value
}

function fillSectionIds(content: LegalPageContent): LegalPageContent {
    const used = new Set<string>()
    const sections = content.sections.map((section, index) => {
        let id = slugify(section.id || section.title) || `section-${index + 1}`
        let suffix = 2
        const base = id
        while (used.has(id)) id = `${base}-${suffix++}`
        used.add(id)
        return { ...section, id }
    })
    return { ...content, sections }
}

/** Trims every field and gives legal sections a unique anchor id. */
export function cleanContent<Id extends SitePageId>(id: Id, content: SitePageContentMap[Id]): SitePageContentMap[Id] {
    const trimmed = trimDeep(content)
    if (id === 'privacy' || id === 'terms') return fillSectionIds(trimmed as LegalPageContent) as SitePageContentMap[Id]
    return trimmed
}

function humanize(key: string | number) {
    if (typeof key === 'number') return `item ${key + 1}`
    const words = key.replace(/([A-Z])/g, ' $1').toLowerCase()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

function emptyPaths(value: unknown, path: (string | number)[] = []): (string | number)[][] {
    if (typeof value === 'string') return value.trim() ? [] : [path]
    if (Array.isArray(value)) {
        if (value.length === 0) return [path]
        return value.flatMap((item, index) => emptyPaths(item, [...path, index]))
    }
    if (value && typeof value === 'object') {
        return Object.entries(value).flatMap(([key, v]) => emptyPaths(v, [...path, key]))
    }
    return []
}

export function contentProblems<Id extends SitePageId>(id: Id, content: SitePageContentMap[Id]): string[] {
    const legal = id === 'privacy' || id === 'terms'
    const problems = emptyPaths(content)
        .filter((path) => !(legal && path[0] === 'sections' && path[2] === 'id'))
        .map((path) => `${path.map(humanize).join(' › ')} is empty.`)
    if (id === 'about') {
        const email = (content as SitePageContentMap['about']).transparency.contact.email.trim()
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push('Transparency contact email is not valid.')
    }
    return problems
}
