import { ChevronDown, LayoutGrid, Rows3, Search, Star, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { DestinationView } from '../../../hooks/useDestinationFilters'
import { selectClass as controlClass } from '../../../lib/formStyles'
import { REGION_OPTIONS, type TourSearchParams, type TourSort } from '../../../types/tour'

const SORT_OPTIONS: { id: TourSort; label: string }[] = [
    { id: 'custom', label: 'Custom order' },
    { id: 'name', label: 'Name' },
    { id: 'location', label: 'Location' },
    { id: 'region', label: 'Region' },
    { id: 'featured', label: 'Featured first' },
    { id: 'updated', label: 'Recently updated' },
]

type DestinationFiltersProps = {
    filters: TourSearchParams
    view: DestinationView
    onChange: (patch: Partial<TourSearchParams> & { view?: DestinationView }) => void
    onSortChange: (sort: TourSort) => void
}

export default function DestinationFilters({
    filters,
    view,
    onChange,
    onSortChange,
}: DestinationFiltersProps) {
    const [query, setQuery] = useState(filters.q)
    const [syncedQuery, setSyncedQuery] = useState(filters.q)

    if (filters.q !== syncedQuery) {
        setSyncedQuery(filters.q)
        setQuery(filters.q)
    }

    useEffect(() => {
        if (query.trim() === filters.q.trim()) return
        const timer = window.setTimeout(() => onChange({ q: query }), 300)
        return () => window.clearTimeout(timer)
    }, [query, filters.q, onChange])

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
                <Search
                    size={15}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-deep"
                    aria-hidden
                />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title, place, or slug…"
                    aria-label="Search destinations"
                    autoComplete="off"
                    className={`${controlClass} w-full pr-9 pl-9 placeholder:text-ink/40 [&::-webkit-search-cancel-button]:hidden`}
                />
                {query ? (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => {
                            setQuery('')
                            onChange({ q: '' })
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/45 transition hover:bg-royal/5 hover:text-royal"
                    >
                        <X size={14} strokeWidth={1.6} />
                    </button>
                ) : null}
            </div>

            <SelectControl
                label="Region"
                value={filters.region}
                onChange={(value) => onChange({ region: value as TourSearchParams['region'] })}
            >
                <option value="all">All regions</option>
                {REGION_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </SelectControl>

            <button
                type="button"
                aria-pressed={filters.featured}
                onClick={() => onChange({ featured: !filters.featured })}
                className={`inline-flex h-9 items-center gap-1.5 rounded-[3px] border px-3 text-sm transition ${
                    filters.featured
                        ? 'border-royal bg-royal text-cream'
                        : 'border-royal/25 bg-white/60 text-ink/70 hover:border-royal hover:text-royal'
                }`}
            >
                <Star
                    size={14}
                    strokeWidth={1.75}
                    className={filters.featured ? 'fill-gold-deep text-gold-deep' : ''}
                    aria-hidden
                />
                Featured only
            </button>

            <SelectControl
                label="Sort"
                value={filters.sort}
                onChange={(value) => onSortChange(value as TourSort)}
            >
                {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </SelectControl>

            <div
                role="group"
                aria-label="View"
                className="inline-flex h-9 items-center rounded-[3px] border border-royal/25 bg-white/60 p-0.5"
            >
                <ViewButton
                    label="Card view"
                    active={view === 'cards'}
                    onClick={() => onChange({ view: 'cards' })}
                >
                    <LayoutGrid size={15} strokeWidth={1.6} />
                </ViewButton>
                <ViewButton
                    label="Table view"
                    active={view === 'table'}
                    onClick={() => onChange({ view: 'table' })}
                >
                    <Rows3 size={15} strokeWidth={1.6} />
                </ViewButton>
            </div>
        </div>
    )
}

function SelectControl({
    label,
    value,
    onChange,
    children,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    children: ReactNode
}) {
    return (
        <div className="relative">
            <select
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`${controlClass} cursor-pointer appearance-none pr-8 pl-3`}
            >
                {children}
            </select>
            <ChevronDown
                size={14}
                strokeWidth={1.6}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-royal/70"
                aria-hidden
            />
        </div>
    )
}

function ViewButton({
    label,
    active,
    onClick,
    children,
}: {
    label: string
    active: boolean
    onClick: () => void
    children: ReactNode
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={active}
            onClick={onClick}
            className={`flex h-full w-8 items-center justify-center rounded-[2px] transition ${
                active ? 'bg-royal text-cream' : 'text-ink/55 hover:text-royal'
            }`}
        >
            {children}
        </button>
    )
}
