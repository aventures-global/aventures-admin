import { Download, FilePlus2, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AdminPanel, DataTableBody, DataTableHead, EmptyState, FilterBar, Pagination, StatusBadge } from '../../components/admin'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import { useGenerateQuotationPdf, useQuotations } from '../../hooks/useQuotations'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import { fieldClass, ghostActionClass, primaryActionClass, selectClass } from '../../lib/formStyles'
import {
    downloadQuotationPdf,
    STATUS_LABELS,
    type Quotation,
    type QuotationStatus,
} from '../../services/quotationService'

const STATUSES = Object.keys(STATUS_LABELS) as QuotationStatus[]

function statusTone(status: QuotationStatus) {
    if (status === 'ACCEPTED' || status === 'CONVERTED') return 'success' as const
    if (status === 'DECLINED' || status === 'EXPIRED') return 'danger' as const
    if (status === 'SENT') return 'accent' as const
    if (status === 'DRAFT') return 'neutral' as const
    return 'warning' as const
}

export default function Quotations() {
    const { can } = useAuth()
    const canView = can('quotations.view')
    const canManage = can('quotations.manage')
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const customerUserId = searchParams.get('customer') || undefined
    const [q, setQ] = useState(searchParams.get('q') ?? '')
    const [debouncedQ, setDebouncedQ] = useState(q)
    const [status, setStatus] = useState<QuotationStatus | 'all'>(
        (searchParams.get('status') as QuotationStatus | 'all') || 'all',
    )
    const [page, setPage] = useState(1)
    const [notice, setNotice] = useNotice()
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const generatePdf = useGenerateQuotationPdf()

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

    const openQuote = (id: string) => navigate(`/clients/quotations/${id}`)

    const handleDownload = (quote: Quotation, event: MouseEvent | KeyboardEvent) => {
        event.stopPropagation()
        event.preventDefault()

        const finishDownload = (id: string, number: string) =>
            downloadQuotationPdf(id, `${number}.pdf`)
                .then(() => setNotice({ tone: 'ok', text: 'PDF downloading' }))
                .catch((err: Error) => setNotice({ tone: 'error', text: err.message }))
                .finally(() => setDownloadingId(null))

        if (canManage) {
            setDownloadingId(quote.id)
            generatePdf.mutate(quote.id, {
                onSuccess: (result) => {
                    void finishDownload(result.quotation.id, result.quotation.number)
                },
                onError: (err) => {
                    setDownloadingId(null)
                    setNotice({ tone: 'error', text: err.message })
                },
            })
            return
        }

        if (quote.hasPdf) {
            setDownloadingId(quote.id)
            void finishDownload(quote.id, quote.number)
            return
        }
    }

    if (!canView) {
        return (
            <div>
                <PageHeader
                    eyebrow="Clients"
                    title="Quotations"
                    description="You do not have permission to view quotations."
                />
            </div>
        )
    }

    return (
        <div>
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

            <div className="mt-4 space-y-3">
                <Notice notice={notice} />

                <FilterBar>
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
                </FilterBar>

                {isPending ? (
                    <AdminPanel className="overflow-hidden">
                        <div className="skeleton-paper h-48" />
                    </AdminPanel>
                ) : isError ? (
                    <AdminPanel>
                        <EmptyState title="Couldn’t load quotations" body={error.message} />
                    </AdminPanel>
                ) : !data?.items.length ? (
                    <AdminPanel>
                        <EmptyState title="No quotations yet" body="Create a quotation to send pricing to a customer." />
                    </AdminPanel>
                ) : (
                    <AdminPanel className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-70' : ''}`}>
                        <table className="w-full text-left text-sm">
                            <DataTableHead>
                                <tr>
                                    <th className="px-3 py-2.5 font-medium">Number</th>
                                    <th className="px-3 py-2.5 font-medium">Customer</th>
                                    <th className="px-3 py-2.5 font-medium">Title</th>
                                    <th className="px-3 py-2.5 font-medium">Status</th>
                                    <th className="px-3 py-2.5 font-medium text-right">Total</th>
                                    <th className="px-3 py-2.5 font-medium">Updated</th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {data.items.map((quote) => {
                                    const canDownload = canManage || quote.hasPdf
                                    const isDownloading = downloadingId === quote.id
                                    return (
                                        <tr
                                            key={quote.id}
                                            tabIndex={0}
                                            onClick={() => openQuote(quote.id)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') openQuote(quote.id)
                                            }}
                                            className="cursor-pointer transition-colors hover:bg-royal/[0.03] focus-visible:bg-royal/[0.05] focus-visible:outline-none"
                                        >
                                            <td className="px-3 py-2.5 font-medium text-ink">{quote.number}</td>
                                            <td className="px-3 py-2.5 text-ink/75">
                                                {quote.customer?.displayName ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-ink/75">{quote.title}</td>
                                            <td className="px-3 py-2.5">
                                                <StatusBadge tone={statusTone(quote.status)}>
                                                    {STATUS_LABELS[quote.status]}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-3 py-2.5 text-right tabular-nums">{quote.total}</td>
                                            <td className="px-3 py-2.5 text-ink/55">
                                                {new Date(quote.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    className={`${ghostActionClass} px-2 py-1`}
                                                    disabled={!canDownload || isDownloading || generatePdf.isPending}
                                                    title={
                                                        canDownload
                                                            ? 'Download PDF'
                                                            : 'PDF not generated yet'
                                                    }
                                                    aria-label={`Download PDF for ${quote.number}`}
                                                    onClick={(event) => handleDownload(quote, event)}
                                                >
                                                    <Download size={15} strokeWidth={1.75} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </DataTableBody>
                        </table>
                    </AdminPanel>
                )}

                {data ? (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={data.total}
                        isFetching={isFetching}
                        onPageChange={setPage}
                    />
                ) : null}
            </div>
        </div>
    )
}
