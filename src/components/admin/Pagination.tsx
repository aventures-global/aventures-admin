import { ghostActionClass } from '../../lib/formStyles'

export default function Pagination({
    page,
    totalPages,
    total,
    onPageChange,
    isFetching,
}: {
    page: number
    totalPages: number
    total?: number
    onPageChange: (page: number) => void
    isFetching?: boolean
}) {
    if (totalPages <= 1 && total === undefined) return null

    return (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink/55">
            <p>
                {total !== undefined ? (
                    <>
                        {total} {total === 1 ? 'result' : 'results'}
                        {isFetching ? ' · updating…' : null}
                    </>
                ) : isFetching ? (
                    'Updating…'
                ) : (
                    <>
                        Page {page} of {totalPages}
                    </>
                )}
            </p>
            {totalPages > 1 ? (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={ghostActionClass}
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        Previous
                    </button>
                    <span className="text-ink/70">
                        {page} / {totalPages}
                    </span>
                    <button
                        type="button"
                        className={ghostActionClass}
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Next
                    </button>
                </div>
            ) : null}
        </div>
    )
}
