import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '../../components/admin'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import { useNotice } from '../../hooks/useNotice'
import { usePayment, useVoidPayment } from '../../hooks/usePayments'
import { useAuth } from '../../lib/authContext'
import { fieldClass, ghostActionClass, labelClass, primaryActionClass } from '../../lib/formStyles'
import { PAYMENT_STATUS_LABELS } from '../../services/bookingService'
import { METHOD_LABELS } from '../../services/paymentService'

export default function PaymentDetail() {
    const { id = '' } = useParams()
    const { can } = useAuth()
    const canView = can('payments.view')
    const canManage = can('payments.manage')
    const { data: payment, isPending, isError, error, refetch } = usePayment(id, canView)
    const voidPayment = useVoidPayment()
    const [notice, setNotice] = useNotice()
    const [reason, setReason] = useState('')
    const [confirming, setConfirming] = useState(false)

    if (!canView) {
        return (
            <div>
                <PageHeader
                    eyebrow="Clients"
                    title="Payment"
                    description="You do not have permission to view payments."
                />
            </div>
        )
    }

    return (
        <div>
            <Link
                to="/clients/payments"
                className="inline-flex items-center gap-1.5 text-sm text-ink/60 transition hover:text-royal"
            >
                <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
                Payments
            </Link>

            {isPending ? (
                <div className="mt-6 space-y-3">
                    <div className="h-24 skeleton-shimmer rounded-[3px]" />
                    <div className="h-48 skeleton-shimmer rounded-[3px]" />
                </div>
            ) : isError ? (
                <div className="mt-6 rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
                    <p className="text-sm text-red-800">{error.message}</p>
                    <button type="button" onClick={() => void refetch()} className="mt-4 text-sm text-royal">
                        Try again
                    </button>
                </div>
            ) : payment ? (
                <div className="mt-4 space-y-3">
                    <PageHeader
                        eyebrow="Clients"
                        title={payment.amount}
                        description={`${payment.booking.title} · ${METHOD_LABELS[payment.method]}`}
                        actions={
                            payment.voidedAt ? (
                                <StatusBadge tone="danger">Voided</StatusBadge>
                            ) : (
                                <StatusBadge tone="success">Recorded</StatusBadge>
                            )
                        }
                    />
                    <Notice notice={notice} />

                    <section className="admin-panel grid gap-4 rounded-[3px] p-5 sm:grid-cols-2">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-ink/45">Customer</p>
                            {payment.customerUserId ? (
                                <Link
                                    to={`/clients/customers/${payment.customerUserId}`}
                                    className="mt-1 block text-sm font-medium text-royal hover:underline"
                                >
                                    {payment.customer?.displayName ?? 'Customer'}
                                </Link>
                            ) : (
                                <p className="mt-1 text-sm font-medium text-ink">
                                    {payment.booking.quotation?.customerName ||
                                        payment.booking.quotation?.customerEmail ||
                                        'Guest'}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-ink/45">Booking balance</p>
                            <p className="mt-1 text-sm text-ink">
                                Paid {payment.booking.paid} of {payment.booking.total} · Remaining{' '}
                                {payment.booking.remaining}
                            </p>
                            <p className="mt-1 text-xs text-ink/55">
                                Status: {PAYMENT_STATUS_LABELS[payment.booking.paymentStatus]}
                                {payment.booking.isOverdue ? ' · Overdue' : ''}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-ink/45">Paid on</p>
                            <p className="mt-1 text-sm text-ink">
                                {new Date(payment.paidAt).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-ink/45">Reference</p>
                            <p className="mt-1 text-sm text-ink">{payment.reference || '—'}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs uppercase tracking-wide text-ink/45">Notes</p>
                            <p className="mt-1 text-sm text-ink">{payment.notes || '—'}</p>
                        </div>
                        {payment.booking.quotation ? (
                            <div className="sm:col-span-2">
                                <p className="text-xs uppercase tracking-wide text-ink/45">Quotation</p>
                                <Link
                                    to={`/clients/quotations/${payment.booking.quotation.id}`}
                                    className="mt-1 inline-block text-sm text-royal hover:underline"
                                >
                                    {payment.booking.quotation.number} · {payment.booking.quotation.title}
                                </Link>
                            </div>
                        ) : null}
                        {payment.voidedAt ? (
                            <div className="sm:col-span-2 rounded-[3px] border border-red-700/15 bg-red-50/50 p-3">
                                <p className="text-sm text-red-800">
                                    Voided {new Date(payment.voidedAt).toLocaleString()}
                                    {payment.voidReason ? ` — ${payment.voidReason}` : ''}
                                </p>
                            </div>
                        ) : null}
                    </section>

                    {canManage && !payment.voidedAt ? (
                        <section className="admin-panel space-y-3 rounded-[3px] p-5">
                            <p className="text-sm font-medium text-ink">Void payment</p>
                            <p className="text-sm text-ink/55">
                                Voiding reverses the booking balance and the linked finance income entry.
                            </p>
                            {!confirming ? (
                                <button
                                    type="button"
                                    className={`${ghostActionClass} text-red-700`}
                                    onClick={() => setConfirming(true)}
                                >
                                    Void this payment
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className={labelClass} htmlFor="voidReason">
                                            Reason (optional)
                                        </label>
                                        <input
                                            id="voidReason"
                                            value={reason}
                                            onChange={(event) => setReason(event.target.value)}
                                            className={fieldClass}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className={`${primaryActionClass} bg-red-700 hover:bg-red-800`}
                                            disabled={voidPayment.isPending}
                                            onClick={() =>
                                                voidPayment.mutate(
                                                    { id: payment.id, reason: reason.trim() || null },
                                                    {
                                                        onSuccess: () => {
                                                            setConfirming(false)
                                                            setNotice({ tone: 'ok', text: 'Payment voided' })
                                                        },
                                                        onError: (err) =>
                                                            setNotice({ tone: 'error', text: err.message }),
                                                    },
                                                )
                                            }
                                        >
                                            {voidPayment.isPending ? 'Voiding…' : 'Confirm void'}
                                        </button>
                                        <button
                                            type="button"
                                            className={ghostActionClass}
                                            onClick={() => setConfirming(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
