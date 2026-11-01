import { ArrowRight, Contact, FileText, FolderOpen, MapPin, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminPanel, StatusBadge } from '../components/admin'
import PageHeader from '../components/PageHeader'
import { isReady, navGroups, pagePath } from '../config/navigation'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { usePaymentSummary } from '../hooks/usePayments'
import { useQuotations } from '../hooks/useQuotations'
import { useTours } from '../hooks/useTours'
import { useAuth } from '../lib/authContext'
import { STATUS_LABELS, type QuotationStatus } from '../services/quotationService'

const QUOTE_STATUSES = Object.keys(STATUS_LABELS) as QuotationStatus[]

export default function Dashboard() {
    const { can, displayName } = useAuth()
    const canCustomers = can('clients.view')
    const canQuotes = can('quotations.view')
    const canDocs = can('documents.view')
    const canPayments = can('payments.view')

    const customers = useAdminUsers(
        { q: '', scope: 'customers', role: 'all', sort: 'createdAt', dir: 'desc', page: 1, limit: 1 },
        { enabled: canCustomers },
    )
    const quotations = useQuotations({ q: '', status: 'all', page: 1, limit: 8 }, canQuotes)
    const paymentSummary = usePaymentSummary({}, canPayments)
    const tours = useTours()

    const liveLinks = navGroups.flatMap((group) =>
        group.pages.filter(isReady).map((page) => ({
            label: page.label,
            to: pagePath(group, page),
            group: group.label,
            icon: page.icon,
        })),
    )

    return (
        <div>
            <PageHeader
                title="Home"
                description={
                    displayName
                        ? `Welcome back, ${displayName.split(' ')[0]}. Jump into live work from here.`
                        : 'Jump into live work from here.'
                }
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    label="Customers"
                    value={canCustomers ? formatCount(customers.data?.total) : '—'}
                    href="/clients/customers"
                    icon={Contact}
                    loading={canCustomers && customers.isPending}
                    disabled={!canCustomers}
                />
                <SummaryCard
                    label="Quotations"
                    value={canQuotes ? formatCount(quotations.data?.total) : '—'}
                    href="/clients/quotations"
                    icon={FileText}
                    loading={canQuotes && quotations.isPending}
                    disabled={!canQuotes}
                />
                <SummaryCard
                    label="Outstanding"
                    value={canPayments ? (paymentSummary.data?.outstanding ?? '—') : '—'}
                    href="/clients/payments?tab=receivables"
                    icon={Wallet}
                    loading={canPayments && paymentSummary.isPending}
                    disabled={!canPayments}
                />
                <SummaryCard
                    label="Documents"
                    value={canDocs ? 'Browse' : '—'}
                    href="/clients/documents"
                    icon={FolderOpen}
                    disabled={!canDocs}
                />
                <SummaryCard
                    label="Destinations"
                    value={formatCount(tours.data?.length)}
                    href="/cms/destinations"
                    icon={MapPin}
                    loading={tours.isPending}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <AdminPanel className="p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-ink">Recent quotations</h2>
                        {canQuotes ? (
                            <Link to="/clients/quotations" className="text-xs font-medium text-royal hover:underline">
                                View all
                            </Link>
                        ) : null}
                    </div>

                    {!canQuotes ? (
                        <p className="mt-6 text-sm text-ink/55">You do not have permission to view quotations.</p>
                    ) : quotations.isPending ? (
                        <div className="mt-4 space-y-2">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="skeleton-paper h-10 rounded-[3px]" />
                            ))}
                        </div>
                    ) : quotations.isError ? (
                        <p className="mt-6 text-sm text-red-700">{quotations.error.message}</p>
                    ) : !quotations.data?.items.length ? (
                        <p className="mt-6 text-sm text-ink/55">No quotations yet.</p>
                    ) : (
                        <ul className="mt-3 divide-y divide-admin-border">
                            {quotations.data.items.map((quote) => (
                                <li key={quote.id}>
                                    <Link
                                        to={`/clients/quotations/${quote.id}`}
                                        className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:bg-royal/[0.03]"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium text-ink">{quote.number}</span>
                                            <span className="block truncate text-xs text-ink/50">
                                                {quote.customer?.displayName ?? quote.title}
                                            </span>
                                        </span>
                                        <StatusBadge tone={quoteTone(quote.status)}>
                                            {STATUS_LABELS[quote.status]}
                                        </StatusBadge>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {canQuotes ? (
                        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-admin-border pt-3">
                            {QUOTE_STATUSES.map((status) => (
                                <Link
                                    key={status}
                                    to={`/clients/quotations?status=${status}`}
                                    className="rounded-full border border-admin-border px-2.5 py-0.5 text-[11px] text-ink/65 transition hover:border-royal hover:text-royal"
                                >
                                    {STATUS_LABELS[status]}
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </AdminPanel>

                <AdminPanel className="p-4">
                    <h2 className="text-sm font-semibold text-ink">Jump to</h2>
                    <ul className="mt-3 space-y-0.5">
                        {liveLinks.map((item) => {
                            const Icon = item.icon
                            return (
                                <li key={item.to}>
                                    <Link
                                        to={item.to}
                                        className="flex items-center gap-2.5 rounded-[3px] px-2 py-2 text-sm text-ink/75 transition hover:bg-royal/[0.04] hover:text-royal"
                                    >
                                        <Icon size={15} strokeWidth={1.5} aria-hidden />
                                        <span className="min-w-0 flex-1 truncate">
                                            <span className="font-medium text-ink">{item.label}</span>
                                            <span className="ml-2 text-xs text-ink/40">{item.group}</span>
                                        </span>
                                        <ArrowRight size={14} className="shrink-0 opacity-40" aria-hidden />
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                    <Link
                        to="/roadmap"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-royal hover:underline"
                    >
                        Full product roadmap
                        <ArrowRight size={14} aria-hidden />
                    </Link>
                </AdminPanel>
            </div>
        </div>
    )
}

function SummaryCard({
    label,
    value,
    href,
    icon: Icon,
    loading,
    disabled,
}: {
    label: string
    value: string
    href: string
    icon: typeof Contact
    loading?: boolean
    disabled?: boolean
}) {
    const content = (
        <>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-ink/50">{label}</p>
                <Icon size={15} strokeWidth={1.5} className="text-ink/35" aria-hidden />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                {loading ? <span className="inline-block h-7 w-12 skeleton-paper rounded-[3px]" /> : value}
            </p>
        </>
    )

    if (disabled) {
        return <div className="admin-panel rounded-[3px] p-4 opacity-60">{content}</div>
    }

    return (
        <Link to={href} className="admin-panel block rounded-[3px] p-4 transition hover:border-royal/40">
            {content}
        </Link>
    )
}

function formatCount(value: number | undefined) {
    if (value === undefined) return '—'
    return value.toLocaleString()
}

function quoteTone(status: QuotationStatus) {
    if (status === 'ACCEPTED' || status === 'CONVERTED') return 'success' as const
    if (status === 'DECLINED' || status === 'EXPIRED') return 'danger' as const
    if (status === 'SENT') return 'accent' as const
    return 'neutral' as const
}
