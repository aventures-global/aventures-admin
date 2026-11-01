import { Link } from 'react-router-dom'
import { linkClass } from '../../lib/formStyles'
import { METHOD_LABELS, type Payment } from '../../services/paymentService'

type RecentPaymentsProps = {
    customerId: string
    items: Payment[]
    isPending: boolean
    isError: boolean
    errorMessage?: string
}

export default function RecentPayments({
    customerId,
    items,
    isPending,
    isError,
    errorMessage,
}: RecentPaymentsProps) {
    const seeAll = `/clients/payments?customer=${encodeURIComponent(customerId)}`

    return (
        <section className="admin-panel flex h-full flex-col space-y-4 rounded-[3px] p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Recent payments</p>
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
                <p className="text-sm text-red-800">{errorMessage ?? 'Could not load payments.'}</p>
            ) : !items.length ? (
                <p className="text-sm text-ink/55">No payments yet for this customer.</p>
            ) : (
                <ul className="divide-y divide-royal/10">
                    {items.map((payment) => (
                        <li key={payment.id}>
                            <Link
                                to={`/clients/payments/${payment.id}`}
                                className="block space-y-1 py-3 transition hover:bg-royal/[0.03]"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-ink">
                                            {payment.booking.title}
                                        </p>
                                        <p className="truncate text-xs text-ink/55">
                                            {METHOD_LABELS[payment.method]}
                                            {payment.voidedAt ? ' · Voided' : ''}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-sm tabular-nums text-ink">{payment.amount}</span>
                                </div>
                                <p className="text-xs text-ink/45">
                                    {new Date(payment.paidAt).toLocaleDateString()}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
