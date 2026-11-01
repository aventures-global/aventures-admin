import { Link } from 'react-router-dom'
import { StatusBadge } from '../admin'
import { linkClass } from '../../lib/formStyles'
import { STATUS_LABELS, type Quotation, type QuotationStatus } from '../../services/quotationService'

function statusTone(status: QuotationStatus) {
    if (status === 'ACCEPTED' || status === 'CONVERTED') return 'success' as const
    if (status === 'DECLINED' || status === 'EXPIRED') return 'danger' as const
    if (status === 'SENT') return 'accent' as const
    if (status === 'DRAFT') return 'neutral' as const
    return 'warning' as const
}

type RecentQuotationsProps = {
    customerId: string
    items: Quotation[]
    isPending: boolean
    isError: boolean
    errorMessage?: string
}

export default function RecentQuotations({
    customerId,
    items,
    isPending,
    isError,
    errorMessage,
}: RecentQuotationsProps) {
    const seeAll = `/clients/quotations?customer=${encodeURIComponent(customerId)}`

    return (
        <section className="admin-panel flex h-full flex-col space-y-4 rounded-[3px] p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Recent quotations</p>
                <Link to={seeAll} className={`${linkClass} text-xs no-underline hover:underline`}>
                    See all
                </Link>
            </div>

            {isPending ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-14 skeleton-shimmer rounded-[3px]" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-sm text-red-800">{errorMessage ?? 'Could not load quotations.'}</p>
            ) : !items.length ? (
                <p className="text-sm text-ink/55">No quotations yet for this customer.</p>
            ) : (
                <ul className="divide-y divide-royal/10">
                    {items.map((quote) => (
                        <li key={quote.id}>
                            <Link
                                to={`/clients/quotations/${quote.id}`}
                                className="block space-y-1 py-3 transition hover:bg-royal/[0.03]"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-ink">{quote.number}</p>
                                        <p className="truncate text-xs text-ink/55">{quote.title}</p>
                                    </div>
                                    <StatusBadge tone={statusTone(quote.status)}>
                                        {STATUS_LABELS[quote.status]}
                                    </StatusBadge>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-xs text-ink/45">
                                    <span className="tabular-nums">{quote.total}</span>
                                    <span>{new Date(quote.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
