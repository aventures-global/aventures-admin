import { GripVertical, Info, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import DestinationCardGrid from '../../components/cms/destinations/DestinationCardGrid'
import DestinationFilters from '../../components/cms/destinations/DestinationFilters'
import DestinationTable from '../../components/cms/destinations/DestinationTable'
import LoadMoreSentinel from '../../components/cms/destinations/LoadMoreSentinel'
import { defaultDir, useDestinationFilters } from '../../hooks/useDestinationFilters'
import { useMoveTour, useTourSearch } from '../../hooks/useTours'
import type { TourMove } from '../../services/tourService'
import type { TourSort } from '../../types/tour'

export default function Destinations() {
    const { filters, view, update, hasFilters, clearFilters } = useDestinationFilters()
    const { data, isPending, isError, error, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useTourSearch(filters)
    const moveTour = useMoveTour()
    const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

    const tours = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])
    const total = data?.pages[0]?.total ?? 0
    const sortable =
        view === 'cards' && filters.sort === 'custom' && filters.dir === 'asc' && !hasFilters

    useEffect(() => {
        if (!notice) return
        const timer = window.setTimeout(() => setNotice(null), 2500)
        return () => window.clearTimeout(timer)
    }, [notice])

    const changeSort = (sort: TourSort) => update({ sort, dir: defaultDir(sort) })

    const toggleSort = (sort: TourSort) => {
        if (filters.sort === sort) update({ dir: filters.dir === 'asc' ? 'desc' : 'asc' })
        else changeSort(sort)
    }

    const handleMove = (input: { slug: string; from: number; to: number; move: TourMove }) => {
        moveTour.mutate(
            { params: filters, ...input },
            {
                onSuccess: () => setNotice({ tone: 'ok', text: 'Order saved' }),
                onError: (err) => setNotice({ tone: 'error', text: err.message }),
            },
        )
    }

    return (
        <div>
            <PageHeader
                eyebrow="CMS"
                title="Destinations"
                description="Signature journeys shown on the public Destinations page. Open a destination to edit it exactly as visitors see it."
                actions={
                    <Link
                        to="new"
                        className="btn-gold inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm"
                    >
                        <Plus size={15} strokeWidth={1.75} aria-hidden />
                        New destination
                    </Link>
                }
            />

            <div className="mt-6 space-y-3">
                <DestinationFilters
                    filters={filters}
                    view={view}
                    onChange={update}
                    onSortChange={changeSort}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <p className="text-silver/60" aria-live="polite">
                        {isPending
                            ? 'Loading…'
                            : tours.length < total
                              ? `${tours.length} of ${total} destinations`
                              : `${total} destination${total === 1 ? '' : 's'}`}
                        {hasFilters ? (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="ml-3 text-gold transition hover:text-ivory"
                            >
                                Clear filters
                            </button>
                        ) : null}
                    </p>
                    {view === 'cards' && total > 1 ? (
                        <p className="flex items-center gap-1.5 text-silver/50">
                            {sortable ? (
                                <>
                                    <GripVertical size={13} strokeWidth={1.6} aria-hidden />
                                    Drag cards to set the order shown on the site
                                </>
                            ) : (
                                <>
                                    <Info size={13} strokeWidth={1.6} aria-hidden />
                                    Clear filters and switch to Custom order to rearrange
                                </>
                            )}
                        </p>
                    ) : null}
                </div>

                {notice ? (
                    <p
                        role="status"
                        className={`rounded-lg border px-3 py-2 text-sm ${
                            notice.tone === 'ok'
                                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-red-400/30 bg-red-500/10 text-red-300'
                        }`}
                    >
                        {notice.text}
                    </p>
                ) : null}
            </div>

            <div className="mt-4">
                {isPending ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="aspect-[4/3] skeleton-shimmer rounded-xl" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="rounded-xl border border-red-400/20 px-6 py-12 text-center">
                        <p className="text-sm text-red-300">{error.message}</p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="mt-4 text-sm text-gold transition hover:text-ivory"
                        >
                            Try again
                        </button>
                    </div>
                ) : tours.length === 0 ? (
                    <div className="rounded-xl border border-white/10 px-6 py-16 text-center">
                        <p className="font-serif text-2xl text-white">
                            {hasFilters ? 'No destinations matched' : 'No destinations yet'}
                        </p>
                        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-silver/70">
                            {hasFilters
                                ? 'Try another search or clear the filters.'
                                : 'Create the first signature journey to publish it on the site.'}
                        </p>
                        {hasFilters ? (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-6 text-sm text-gold transition hover:text-ivory"
                            >
                                Clear filters
                            </button>
                        ) : (
                            <Link
                                to="new"
                                className="mt-6 inline-block text-sm text-gold transition hover:text-ivory"
                            >
                                New destination
                            </Link>
                        )}
                    </div>
                ) : view === 'table' ? (
                    <DestinationTable
                        tours={tours}
                        sort={filters.sort}
                        dir={filters.dir}
                        onSort={toggleSort}
                    />
                ) : (
                    <DestinationCardGrid tours={tours} sortable={sortable} onMove={handleMove} />
                )}

                {!isPending && !isError ? (
                    <>
                        {isFetchingNextPage && view === 'cards' ? (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="aspect-[4/3] skeleton-shimmer rounded-xl" />
                                ))}
                            </div>
                        ) : null}
                        <LoadMoreSentinel
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            onLoadMore={() => void fetchNextPage()}
                        />
                    </>
                ) : null}
            </div>
        </div>
    )
}
