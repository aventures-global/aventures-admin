import { Download, Search, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
    AdminPanel,
    DataTableBody,
    DataTableHead,
    EmptyState,
    FilterBar,
    Pagination,
    StatusBadge,
} from '../../components/admin'
import PaymentSummaryCards from '../../components/payments/PaymentSummaryCards'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import SelectMenu from '../../components/ui/SelectMenu'
import { useBookings } from '../../hooks/useBookings'
import { useNotice } from '../../hooks/useNotice'
import { usePaymentSummary, usePayments } from '../../hooks/usePayments'
import { useAuth } from '../../lib/authContext'
import { fieldClass, ghostActionClass, primaryActionClass } from '../../lib/formStyles'
import {
    PAYMENT_STATUS_LABELS,
    type BookingPaymentStatus,
    type BookingPaymentStatusFilter,
} from '../../services/bookingService'
import {
    downloadPaymentsCsv,
    METHOD_LABELS,
    type PaymentMethod,
} from '../../services/paymentService'

type Tab = 'transactions' | 'receivables'

function monthRange() {
    const now = new Date()
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    return { from: from.toISOString(), to: to.toISOString() }
}

function paymentStatusTone(status: BookingPaymentStatus) {
    if (status === 'PAID') return 'success' as const
    if (status === 'OVERPAID') return 'accent' as const
    if (status === 'PARTIAL') return 'warning' as const
    return 'neutral' as const
}

export default function Payments() {
    const { can } = useAuth()
    const canView = can('payments.view')
    const canManage = can('payments.manage')
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const isListRoute =
        location.pathname === '/clients/payments' || location.pathname === '/clients/payments/'
    const customerUserId = searchParams.get('customer') || undefined
    const tab = (searchParams.get('tab') as Tab) || 'transactions'
    const [q, setQ] = useState(searchParams.get('q') ?? '')
    const [debouncedQ, setDebouncedQ] = useState(q)
    const [method, setMethod] = useState<PaymentMethod | 'all'>(
        (searchParams.get('method') as PaymentMethod | 'all') || 'all',
    )
    const [paymentStatus, setPaymentStatus] = useState<BookingPaymentStatusFilter>(
        (searchParams.get('paymentStatus') as BookingPaymentStatusFilter) || 'open',
    )
    const [page, setPage] = useState(1)
    const [notice, setNotice] = useNotice()
    const [exporting, setExporting] = useState(false)
    const range = useMemo(() => monthRange(), [])

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250)
        return () => window.clearTimeout(timer)
    }, [q])

    useEffect(() => {
        // Keep modal query params (`booking`, etc.) intact while /new is open.
        if (!isListRoute) return
        const next = new URLSearchParams()
        if (customerUserId) next.set('customer', customerUserId)
        if (tab !== 'transactions') next.set('tab', tab)
        if (debouncedQ) next.set('q', debouncedQ)
        if (method !== 'all') next.set('method', method)
        if (paymentStatus !== 'open') next.set('paymentStatus', paymentStatus)
        setSearchParams(next, { replace: true })
        setPage(1)
    }, [customerUserId, tab, debouncedQ, method, paymentStatus, setSearchParams, isListRoute])

    const paymentParams = useMemo(
        () => ({
            q: debouncedQ,
            customerUserId,
            method,
            page,
            limit: 20,
        }),
        [debouncedQ, customerUserId, method, page],
    )

    const bookingParams = useMemo(
        () => ({
            q: debouncedQ,
            customerUserId,
            paymentStatus,
            page,
            limit: 20,
        }),
        [debouncedQ, customerUserId, paymentStatus, page],
    )

    const payments = usePayments(paymentParams, canView && tab === 'transactions')
    const bookings = useBookings(bookingParams, canView && tab === 'receivables')
    const summary = usePaymentSummary(range, canView)
    const totalPages =
        tab === 'transactions'
            ? payments.data
                ? Math.max(1, Math.ceil(payments.data.total / payments.data.limit))
                : 1
            : bookings.data
              ? Math.max(1, Math.ceil(bookings.data.total / bookings.data.limit))
              : 1

    const setTab = (next: Tab) => {
        const params = new URLSearchParams(searchParams)
        if (next === 'transactions') params.delete('tab')
        else params.set('tab', next)
        setSearchParams(params)
        setPage(1)
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            await downloadPaymentsCsv(paymentParams)
            setNotice({ tone: 'ok', text: 'CSV downloading' })
        } catch (err) {
            setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Export failed' })
        } finally {
            setExporting(false)
        }
    }

    if (!canView) {
        return (
            <div>
                <PageHeader
                    eyebrow="Clients"
                    title="Payments"
                    description="You do not have permission to view payments."
                />
                <Outlet />
            </div>
        )
    }

    return (
        <div>
            <PageHeader
                eyebrow="Clients"
                title="Payments"
                description="Record customer payments and track booking balances."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={ghostActionClass}
                            disabled={exporting}
                            onClick={() => void handleExport()}
                        >
                            <Download size={15} strokeWidth={1.75} />
                            {exporting ? 'Exporting…' : 'Export CSV'}
                        </button>
                        {canManage ? (
                            <Link
                                to={
                                    customerUserId
                                        ? `/clients/payments/new?customer=${encodeURIComponent(customerUserId)}`
                                        : '/clients/payments/new'
                                }
                                className={primaryActionClass}
                            >
                                <Wallet size={15} strokeWidth={1.75} />
                                Record payment
                            </Link>
                        ) : null}
                    </div>
                }
            />

            <div className="mt-4 space-y-3">
                <Notice notice={notice} />
                <PaymentSummaryCards summary={summary.data} loading={summary.isPending} />

                <div className="flex gap-2">
                    <button
                        type="button"
                        className={tab === 'transactions' ? primaryActionClass : ghostActionClass}
                        onClick={() => setTab('transactions')}
                    >
                        Transactions
                    </button>
                    <button
                        type="button"
                        className={tab === 'receivables' ? primaryActionClass : ghostActionClass}
                        onClick={() => setTab('receivables')}
                    >
                        Receivables
                    </button>
                </div>

                <FilterBar>
                    <div className="relative min-w-[220px] flex-1">
                        <Search
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                        />
                        <input
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder={
                                tab === 'transactions'
                                    ? 'Search customer, booking, or reference'
                                    : 'Search booking or customer'
                            }
                            className={`${fieldClass} pl-9`}
                        />
                    </div>
                    {tab === 'transactions' ? (
                        <SelectMenu
                            value={method}
                            aria-label="Payment method"
                            className="w-[11.5rem] shrink-0"
                            onChange={setMethod}
                            options={[
                                { value: 'all', label: 'All methods' },
                                ...(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((value) => ({
                                    value,
                                    label: METHOD_LABELS[value],
                                })),
                            ]}
                        />
                    ) : (
                        <SelectMenu
                            value={paymentStatus}
                            aria-label="Payment status"
                            className="w-[11.5rem] shrink-0"
                            onChange={setPaymentStatus}
                            options={[
                                { value: 'open', label: 'Open balances' },
                                { value: 'all', label: 'All statuses' },
                                ...(Object.keys(PAYMENT_STATUS_LABELS) as BookingPaymentStatus[]).map(
                                    (value) => ({
                                        value,
                                        label: PAYMENT_STATUS_LABELS[value],
                                    }),
                                ),
                            ]}
                        />
                    )}
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

                {tab === 'transactions' ? (
                    payments.isPending ? (
                        <AdminPanel className="overflow-hidden">
                            <div className="skeleton-paper h-48" />
                        </AdminPanel>
                    ) : payments.isError ? (
                        <AdminPanel className="p-6">
                            <p className="text-sm text-red-800">{payments.error.message}</p>
                        </AdminPanel>
                    ) : !payments.data?.items.length ? (
                        <AdminPanel>
                            <EmptyState
                                title="No payments yet"
                                body="Record a payment against a booking to start tracking balances."
                            />
                        </AdminPanel>
                    ) : (
                        <AdminPanel className={`overflow-hidden ${payments.isFetching ? 'opacity-70' : ''}`}>
                            <table className="w-full text-left text-sm">
                                <DataTableHead>
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Booking</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </DataTableHead>
                                <DataTableBody>
                                    {payments.data.items.map((payment) => (
                                        <tr
                                            key={payment.id}
                                            className="cursor-pointer transition hover:bg-royal/[0.03]"
                                            onClick={() => navigate(`/clients/payments/${payment.id}`)}
                                        >
                                            <td className="px-4 py-3 text-ink/65">
                                                {new Date(payment.paidAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {payment.customer?.displayName ||
                                                    payment.booking.quotation?.customerName ||
                                                    payment.booking.quotation?.customerEmail ||
                                                    '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-ink">
                                                        {payment.booking.title}
                                                    </p>
                                                    <p className="truncate text-xs text-ink/45">
                                                        {payment.booking.quotation?.number ?? payment.bookingId}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{METHOD_LABELS[payment.method]}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{payment.amount}</td>
                                            <td className="px-4 py-3">
                                                {payment.voidedAt ? (
                                                    <StatusBadge tone="danger">Voided</StatusBadge>
                                                ) : (
                                                    <StatusBadge
                                                        tone={paymentStatusTone(payment.booking.paymentStatus)}
                                                    >
                                                        {PAYMENT_STATUS_LABELS[payment.booking.paymentStatus]}
                                                    </StatusBadge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </DataTableBody>
                            </table>
                        </AdminPanel>
                    )
                ) : bookings.isPending ? (
                    <AdminPanel className="overflow-hidden">
                        <div className="skeleton-paper h-48" />
                    </AdminPanel>
                ) : bookings.isError ? (
                    <AdminPanel className="p-6">
                        <p className="text-sm text-red-800">{bookings.error.message}</p>
                    </AdminPanel>
                ) : !bookings.data?.items.length ? (
                    <AdminPanel>
                        <EmptyState
                            title="No bookings"
                            body="Convert an accepted quotation to create a booking with a balance to collect."
                        />
                    </AdminPanel>
                ) : (
                    <AdminPanel className={`overflow-hidden ${bookings.isFetching ? 'opacity-70' : ''}`}>
                        <table className="w-full text-left text-sm">
                            <DataTableHead>
                                <tr>
                                    <th className="px-4 py-3">Booking</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-right">Paid</th>
                                    <th className="px-4 py-3 text-right">Remaining</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {bookings.data.items.map((booking) => {
                                    const stillOwes =
                                        booking.paymentStatus === 'UNPAID' ||
                                        booking.paymentStatus === 'PARTIAL'
                                    return (
                                    <tr
                                        key={booking.id}
                                        className="cursor-pointer transition hover:bg-royal/[0.03]"
                                        onClick={() =>
                                            navigate(
                                                canManage && stillOwes
                                                    ? `/clients/payments/new?booking=${encodeURIComponent(booking.id)}`
                                                    : booking.customerUserId
                                                      ? `/clients/payments?customer=${encodeURIComponent(booking.customerUserId)}`
                                                      : '/clients/payments',
                                            )
                                        }
                                    >
                                        <td className="px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-ink">{booking.title}</p>
                                                <p className="truncate text-xs text-ink/45">
                                                    {booking.quotation?.number ?? booking.id.slice(0, 8)}
                                                    {booking.isOverdue ? ' · Overdue' : ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {booking.customer?.displayName ||
                                                booking.quotation?.customerName ||
                                                booking.quotation?.customerEmail ||
                                                '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">{booking.total}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{booking.paid}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{booking.remaining}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge tone={paymentStatusTone(booking.paymentStatus)}>
                                                {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
                                            </StatusBadge>
                                        </td>
                                    </tr>
                                    )
                                })}
                            </DataTableBody>
                        </table>
                    </AdminPanel>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={tab === 'transactions' ? (payments.data?.total ?? 0) : (bookings.data?.total ?? 0)}
                    onPageChange={setPage}
                    isFetching={tab === 'transactions' ? payments.isFetching : bookings.isFetching}
                />
            </div>

            <Outlet />
        </div>
    )
}
