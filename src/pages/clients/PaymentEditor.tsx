import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BookingPaymentPicker from '../../components/payments/BookingPaymentPicker'
import Notice from '../../components/cms/faqs/Notice'
import SelectMenu from '../../components/ui/SelectMenu'
import { useBooking } from '../../hooks/useBookings'
import { useNotice } from '../../hooks/useNotice'
import { useCreatePayment } from '../../hooks/usePayments'
import { useAuth } from '../../lib/authContext'
import { fieldClass, ghostActionClass, labelClass, primaryActionClass } from '../../lib/formStyles'
import type { Booking } from '../../services/bookingService'
import {
    centsFromMajor,
    METHOD_LABELS,
    majorFromCents,
    MANUAL_PAYMENT_METHODS,
    type PaymentMethod,
} from '../../services/paymentService'

function todayInputValue() {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

export default function PaymentEditor() {
    const { can } = useAuth()
    const canManage = can('payments.manage')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const bookingFromQuery = searchParams.get('booking') || ''
    const customerFromQuery = searchParams.get('customer') || undefined
    const [notice, setNotice] = useNotice()
    const create = useCreatePayment()

    const [bookingId, setBookingId] = useState(bookingFromQuery)
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER')
    const [paidAt, setPaidAt] = useState(todayInputValue())
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')

    const bookingQuery = useBooking(bookingFromQuery || undefined, Boolean(bookingFromQuery))
    const busy = create.isPending

    const close = () => {
        if (busy) return
        navigate('..')
    }

    useEffect(() => {
        if (bookingQuery.data) {
            setSelectedBooking(bookingQuery.data)
            setBookingId(bookingQuery.data.id)
            if (!amount) setAmount(majorFromCents(bookingQuery.data.remainingCents))
        }
    }, [bookingQuery.data]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) close()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [busy]) // eslint-disable-line react-hooks/exhaustive-deps

    const submit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!canManage) return
        const amountCents = centsFromMajor(amount)
        if (!bookingId) {
            setNotice({ tone: 'error', text: 'Select a booking' })
            return
        }
        if (amountCents <= 0) {
            setNotice({ tone: 'error', text: 'Enter a valid amount' })
            return
        }

        create.mutate(
            {
                bookingId,
                amountCents,
                method,
                paidAt: new Date(`${paidAt}T12:00:00`).toISOString(),
                reference: reference.trim() || null,
                notes: notes.trim() || null,
            },
            {
                onSuccess: (payment) => navigate(`/clients/payments/${payment.id}`),
                onError: (err) => setNotice({ tone: 'error', text: err.message }),
            },
        )
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-royal/30 p-4 font-poppins backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={close}
            >
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="record-payment-dialog-title"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    onClick={(event) => event.stopPropagation()}
                    className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[3px] border border-royal/15 bg-cream p-5 shadow-[0_24px_60px_rgba(22,55,101,0.2)]"
                >
                    <h2 id="record-payment-dialog-title" className="text-lg font-semibold text-ink">
                        Record payment
                    </h2>
                    <p className="mt-1 text-sm text-ink/55">
                        Log a customer payment against a booking balance.
                    </p>

                    {!canManage ? (
                        <p className="mt-5 text-sm text-ink/65">
                            You do not have permission to record payments.
                        </p>
                    ) : (
                        <div className="mt-5 space-y-4">
                            <Notice notice={notice} />
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <span className={labelClass}>Booking</span>
                                    <BookingPaymentPicker
                                        value={bookingId}
                                        selectedBooking={selectedBooking}
                                        customerUserId={customerFromQuery}
                                        disabled={busy}
                                        onChange={(id, booking) => {
                                            setBookingId(id)
                                            setSelectedBooking(booking)
                                            if (booking && !amount) {
                                                setAmount(majorFromCents(booking.remainingCents))
                                            }
                                        }}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass} htmlFor="amount">
                                            Amount ({selectedBooking?.currency ?? 'PHP'})
                                        </label>
                                        <input
                                            id="amount"
                                            value={amount}
                                            onChange={(event) => setAmount(event.target.value)}
                                            className={fieldClass}
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            required
                                            disabled={busy}
                                        />
                                    </div>
                                    <div>
                                        <span className={labelClass}>Method</span>
                                        <SelectMenu
                                            value={method}
                                            aria-label="Payment method"
                                            disabled={busy}
                                            onChange={setMethod}
                                            options={MANUAL_PAYMENT_METHODS.map((value) => ({
                                                value,
                                                label: METHOD_LABELS[value],
                                            }))}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="paidAt">
                                            Paid on
                                        </label>
                                        <input
                                            id="paidAt"
                                            type="date"
                                            value={paidAt}
                                            onChange={(event) => setPaidAt(event.target.value)}
                                            className={fieldClass}
                                            required
                                            disabled={busy}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="reference">
                                            Reference
                                        </label>
                                        <input
                                            id="reference"
                                            value={reference}
                                            onChange={(event) => setReference(event.target.value)}
                                            className={fieldClass}
                                            placeholder="Bank ref / GCash txn"
                                            disabled={busy}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="notes">
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                        className={`${fieldClass} min-h-24`}
                                        placeholder="Optional payment notes"
                                        disabled={busy}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        type="submit"
                                        className={primaryActionClass}
                                        disabled={busy}
                                    >
                                        {busy ? 'Saving…' : 'Save payment'}
                                    </button>
                                    <button
                                        type="button"
                                        className={ghostActionClass}
                                        disabled={busy}
                                        onClick={close}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {!canManage ? (
                        <div className="mt-5">
                            <button type="button" className={ghostActionClass} onClick={close}>
                                Close
                            </button>
                        </div>
                    ) : null}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
