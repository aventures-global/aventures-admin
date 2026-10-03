import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

type LoadMoreSentinelProps = {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    onLoadMore: () => void
}

export default function LoadMoreSentinel({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: LoadMoreSentinelProps) {
    const ref = useRef<HTMLDivElement>(null)
    const onLoadMoreRef = useRef(onLoadMore)

    useEffect(() => {
        onLoadMoreRef.current = onLoadMore
    }, [onLoadMore])

    useEffect(() => {
        const el = ref.current
        if (!el || !hasNextPage || isFetchingNextPage) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current()
            },
            { rootMargin: '400px 0px' },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage])

    if (!hasNextPage) return null

    return (
        <div ref={ref} className="mt-6 flex justify-center">
            <button
                type="button"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-[3px] border-2 border-royal/70 px-5 py-2 text-sm text-royal transition hover:border-gold-deep hover:bg-gold-deep hover:text-white disabled:opacity-60"
            >
                {isFetchingNextPage ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
        </div>
    )
}
