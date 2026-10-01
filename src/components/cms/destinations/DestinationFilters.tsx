import { ChevronDown, LayoutGrid, Rows3, Search, Star, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { DestinationView } from '../../../hooks/useDestinationFilters'
import { REGION_OPTIONS, type TourSearchParams, type TourSort } from '../../../types/tour'

const SORT_OPTIONS: { id: TourSort; label: string }[] = [
    { id: 'custom', label: 'Custom order' },
    { id: 'name', label: 'Name' },
    { id: 'location', label: 'Location' },
    { id: 'region', label: 'Region' },
    { id: 'featured', label: 'Featured first' },
    { id: 'updated', label: 'Recently updated' },
]

const controlClass =
    'h-9 rounded-lg border border-white/15 bg-ink-soft text-sm text-silver outline-none transition focus:border-gold/60'

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
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold/70"
                    aria-hidden
                />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title, place, or slug…"
                    aria-label="Search destinations"
                    autoComplete="off"
                    className={`${controlClass} w-full pr-9 pl-9 placeholder:text-muted [&::-webkit-search-cancel-button]:hidden`}
                />
                {query ? (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => {
                            setQuery('')
                            onChange({ q: '' })
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:text-gold"
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
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition ${
                    filters.featured
                        ? 'border-gold/50 bg-gold/10 text-gold'
                        : 'border-white/15 text-silver/70 hover:border-gold/40 hover:text-gold'
                }`}
            >
                <Star
                    size={14}
                    strokeWidth={1.75}
                    className={filters.featured ? 'fill-gold' : ''}
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
                className="inline-flex h-9 items-center rounded-lg border border-white/15 p-0.5"
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
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gold/70"
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
            className={`flex h-full w-8 items-center justify-center rounded-md transition ${
                active ? 'bg-white/10 text-gold' : 'text-silver/60 hover:text-gold'
            }`}
        >
            {children}
        </button>
    )
}
