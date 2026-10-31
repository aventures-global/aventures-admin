import { FilePlus2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import { useQuotations } from '../../hooks/useQuotations'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import { fieldClass, ghostActionClass, primaryActionClass, selectClass } from '../../lib/formStyles'
import { STATUS_LABELS, type QuotationStatus } from '../../services/quotationService'

const STATUSES = Object.keys(STATUS_LABELS) as QuotationStatus[]

export default function Quotations() {
    const { can } = useAuth()
    const canView = can('quotations.view')
    const canManage = can('quotations.manage')
    const [searchParams, setSearchParams] = useSearchParams()
    const customerUserId = searchParams.get('customer') || undefined
    const [q, setQ] = useState(searchParams.get('q') ?? '')
    const [debouncedQ, setDebouncedQ] = useState(q)
    const [status, setStatus] = useState<QuotationStatus | 'all'>(
        (searchParams.get('status') as QuotationStatus | 'all') || 'all',
    )
    const [page, setPage] = useState(1)
    const [notice] = useNotice()

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250)
        return () => window.clearTimeout(timer)
    }, [q])

    useEffect(() => {
        const next = new URLSearchParams()
        if (customerUserId) next.set('customer', customerUserId)
        if (debouncedQ) next.set('q', debouncedQ)
        if (status !== 'all') next.set('status', status)
        setSearchParams(next, { replace: true })
        setPage(1)
    }, [customerUserId, debouncedQ, status, setSearchParams])

    const params = useMemo(
        () => ({ q: debouncedQ, status, customerUserId, page, limit: 20 }),
        [debouncedQ, status, customerUserId, page],
    )

    const { data, isPending, isError, error, isFetching } = useQuotations(params, canView)
    const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

    if (!canView) {
        return (
            <div className="mt-4">
                <PageHeader
                    eyebrow="Clients"
                    title="Quotations"
                    description="You do not have permission to view quotations."
                />
            </div>
        )
    }

    return (
        <div className="mt-4">
            <PageHeader
                eyebrow="Clients"
                title="Quotations"
                description="Build, send, and track customer quotations."
                actions={
                    canManage ? (
                        <Link
                            to={
                                customerUserId
                                    ? `/clients/quotations/new?customer=${encodeURIComponent(customerUserId)}`
                                    : '/clients/quotations/new'
                            }
                            className={primaryActionClass}
                        >
                            <FilePlus2 size={15} strokeWidth={1.75} />
                            New quotation
                        </Link>
                    ) : null
                }
            />

            <div className="mt-6 space-y-4">
                <Notice notice={notice} />

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                        />
                        <input
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Search number, title, or customer"
                            className={`${fieldClass} pl-9`}
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as QuotationStatus | 'all')}
                        className={`${selectClass} px-2`}
                    >
                        <option value="all">All statuses</option>
                        {STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {STATUS_LABELS[value]}
                            </option>
                        ))}
                    </select>
                    {customerUserId ? (
                        <button
                            type="button"
                            className={ghostActionClass}
                            onClick={() => {
                                const next = new URLSearchParams(searchParams)
                                next.delete('customer')
                                setSearchParams(next)
                            }}
                        >
                            Clear customer filter
                        </button>
                    ) : null}
                </div>

                <div className="overflow-hidden rounded-[3px] border border-royal/10 bg-white/70">
                    {isPending ? (
                        <div className="h-48 skeleton-shimmer" />
                    ) : isError ? (
                        <p className="p-6 text-sm text-red-800">{error.message}</p>
                    ) : !data?.items.length ? (
                        <p className="p-6 text-sm text-ink/55">No quotations yet.</p>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-royal/10 bg-royal/[0.03] text-xs uppercase tracking-wide text-ink/55">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Number</th>
                                    <th className="px-4 py-3 font-medium">Customer</th>
                                    <th className="px-4 py-3 font-medium">Title</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Total</th>
                                    <th className="px-4 py-3 font-medium">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((quote) => (
                                    <tr key={quote.id} className="border-b border-royal/8 last:border-0">
                                        <td className="px-4 py-3">
                                            <Link
                                                to={`/clients/quotations/${quote.id}`}
                                                className="font-medium text-royal hover:underline"
                                            >
                                                {quote.number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-ink/75">
                                            {quote.customer?.displayName ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-ink/75">{quote.title}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-[3px] bg-royal/8 px-2 py-0.5 text-xs text-royal">
                                                {STATUS_LABELS[quote.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">{quote.total}</td>
                                        <td className="px-4 py-3 text-ink/55">
                                            {new Date(quote.updatedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {data && data.total > data.limit ? (
                    <div className="flex items-center justify-between text-sm text-ink/60">
                        <span>
                            Page {page} of {totalPages}
                            {isFetching ? ' · updating…' : ''}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={ghostActionClass}
                                disabled={page <= 1}
                                onClick={() => setPage((value) => value - 1)}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className={ghostActionClass}
                                disabled={page >= totalPages}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
