import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge, type StatusTone } from '../admin'
import { useAuth } from '../../lib/authContext'
import { ghostActionClass } from '../../lib/formStyles'
import {
    KIND_LABELS,
    STATUS_LABELS,
    type Quotation,
    type QuotationStatus,
} from '../../services/quotationService'

function statusTone(status: QuotationStatus): StatusTone {
    if (status === 'ACCEPTED' || status === 'CONVERTED') return 'success'
    if (status === 'DECLINED' || status === 'EXPIRED') return 'danger'
    if (status === 'SENT') return 'accent'
    if (status === 'DRAFT') return 'neutral'
    return 'warning'
}

function formatMoney(cents: number, currency: string) {
    const code = currency.trim().toUpperCase() || 'USD'
    const amount = cents / 100
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    } catch {
        return `${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} ${code}`
    }
}

function formatDate(value: string | null | undefined) {
    if (!value) return null
    return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink/45">{label}</dt>
            <dd className="text-sm text-ink">{children}</dd>
        </div>
    )
}

type QuotationReadonlyViewProps = {
    quotation: Quotation
}

export default function QuotationReadonlyView({ quotation: quote }: QuotationReadonlyViewProps) {
    const { can } = useAuth()
    const canRecordPayment = can('payments.manage')

    const timeline = [
        { label: 'Created', value: formatDate(quote.createdAt) },
        { label: 'Sent', value: formatDate(quote.sentAt) },
        { label: 'Accepted', value: formatDate(quote.acceptedAt) },
        { label: 'Declined', value: formatDate(quote.declinedAt) },
        { label: 'Converted', value: formatDate(quote.convertedAt) },
        { label: 'Valid until', value: formatDate(quote.validUntil) },
    ].filter((row) => row.value)

    return (
        <div className="space-y-4">
            <section className="admin-panel rounded-[3px] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink/45">
                            {quote.number}
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight text-ink">{quote.title}</h2>
                    </div>
                    <StatusBadge tone={statusTone(quote.status)}>{STATUS_LABELS[quote.status]}</StatusBadge>
                </div>

                {timeline.length ? (
                    <dl className="mt-5 grid gap-3 border-t border-admin-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
                        {timeline.map((row) => (
                            <div key={row.label}>
                                <dt className="text-[11px] font-medium uppercase tracking-wide text-ink/45">
                                    {row.label}
                                </dt>
                                <dd className="mt-0.5 text-sm text-ink">{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                ) : null}
            </section>

            <section className="admin-panel rounded-[3px] p-5">
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-ink/45">Details</h3>
                <dl className="mt-4 space-y-3">
                    <MetaRow label="Customer">
                        {quote.customer ? (
                            <Link
                                to={`/clients/customers/${quote.customer.id}`}
                                className="font-medium text-royal hover:underline"
                            >
                                {quote.customer.displayName}
                            </Link>
                        ) : (
                            '—'
                        )}
                        {quote.customer?.email ? (
                            <span className="mt-0.5 block text-xs text-ink/50">{quote.customer.email}</span>
                        ) : null}
                    </MetaRow>
                    <MetaRow label="Currency">{quote.currency}</MetaRow>
                    <MetaRow label="Total">
                        <span className="font-medium tabular-nums text-royal">{quote.total}</span>
                    </MetaRow>
                </dl>
            </section>

            {quote.customerMessage ? (
                <section className="admin-panel rounded-[3px] p-5">
                    <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-ink/45">
                        Message to customer
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                        {quote.customerMessage}
                    </p>
                </section>
            ) : null}

            <section className="admin-panel overflow-hidden rounded-[3px]">
                <div className="border-b border-admin-border px-5 py-4">
                    <h3 className="text-sm font-semibold text-ink">Line items</h3>
                    <p className="mt-0.5 text-xs text-ink/45">Services, packages, and optional add-ons</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="border-b border-admin-border bg-admin-bg text-[11px] font-medium uppercase tracking-wide text-ink/50">
                            <tr>
                                <th className="px-5 py-3">Item</th>
                                <th className="px-4 py-3">Kind</th>
                                <th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">Unit</th>
                                <th className="px-5 py-3 text-right">Line</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-admin-border">
                            {quote.items.map((item) => (
                                <tr key={item.id ?? `${item.title}-${item.sortOrder}`}>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-ink">{item.title}</p>
                                        {item.description ? (
                                            <p className="mt-0.5 text-xs leading-relaxed text-ink/55">
                                                {item.description}
                                            </p>
                                        ) : null}
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {item.isOptional ? (
                                                <StatusBadge tone="warning">Optional</StatusBadge>
                                            ) : null}
                                            {!item.selected ? (
                                                <StatusBadge tone="neutral">Not selected</StatusBadge>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-ink/65">{KIND_LABELS[item.kind]}</td>
                                    <td className="px-4 py-3.5 text-right tabular-nums text-ink/75">
                                        {item.quantity}
                                    </td>
                                    <td className="px-4 py-3.5 text-right tabular-nums text-ink/75">
                                        {formatMoney(item.unitCents, quote.currency)}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-medium tabular-nums text-ink">
                                        {formatMoney(item.lineCents, quote.currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-2 border-t border-admin-border bg-admin-bg/40 px-5 py-4 text-sm">
                    <div className="flex justify-between gap-3 text-ink/70">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{quote.subtotal}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-ink/70">
                        <span>Optional</span>
                        <span className="tabular-nums">{quote.optional}</span>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-admin-border pt-2 text-base font-semibold text-ink">
                        <span>Total</span>
                        <span className="tabular-nums text-royal">{quote.total}</span>
                    </div>
                </div>
            </section>

            {quote.notes ? (
                <section className="admin-panel rounded-[3px] p-5">
                    <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-ink/45">
                        Internal notes
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{quote.notes}</p>
                </section>
            ) : null}

            {quote.booking ? (
                <section className="admin-panel flex flex-wrap items-center justify-between gap-3 rounded-[3px] p-5">
                    <div className="min-w-0 space-y-1">
                        <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-ink/45">
                            Linked booking
                        </h3>
                        <p className="text-sm text-ink">
                            {quote.booking.status}
                            <span className="text-ink/40"> · </span>
                            Total {quote.booking.total}
                            {quote.booking.paid != null ? (
                                <>
                                    <span className="text-ink/40"> · </span>
                                    Paid {quote.booking.paid}
                                    {(quote.booking.paymentStatus === 'UNPAID' ||
                                        quote.booking.paymentStatus === 'PARTIAL') &&
                                    quote.booking.remaining != null ? (
                                        <>
                                            <span className="text-ink/40"> · </span>
                                            Remaining {quote.booking.remaining}
                                        </>
                                    ) : null}
                                </>
                            ) : null}
                        </p>
                    </div>
                    {quote.booking.paymentStatus === 'PAID' ||
                    quote.booking.paymentStatus === 'OVERPAID' ? (
                        <StatusBadge
                            tone={quote.booking.paymentStatus === 'OVERPAID' ? 'accent' : 'success'}
                        >
                            {quote.booking.paymentStatus === 'OVERPAID' ? 'Overpaid' : 'Paid'}
                        </StatusBadge>
                    ) : canRecordPayment ? (
                        <Link
                            to={`/clients/payments/new?booking=${encodeURIComponent(quote.booking.id)}`}
                            className={ghostActionClass}
                        >
                            Record payment
                        </Link>
                    ) : null}
                </section>
            ) : null}
        </div>
    )
}
