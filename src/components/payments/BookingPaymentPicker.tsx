import { Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useBookings } from '../../hooks/useBookings'
import { fieldClass } from '../../lib/formStyles'
import { PAYMENT_STATUS_LABELS, type Booking } from '../../services/bookingService'

type BookingPaymentPickerProps = {
    value: string
    selectedBooking?: Booking | null
    onChange: (bookingId: string, booking: Booking | null) => void
    customerUserId?: string
    disabled?: boolean
}

export default function BookingPaymentPicker({
    value,
    selectedBooking = null,
    onChange,
    customerUserId,
    disabled,
}: BookingPaymentPickerProps) {
    const listId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const [q, setQ] = useState('')
    const [debouncedQ, setDebouncedQ] = useState('')
    const [open, setOpen] = useState(false)
    const [highlight, setHighlight] = useState(0)

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250)
        return () => window.clearTimeout(timer)
    }, [q])

    const { data, isFetching, isPending } = useBookings(
        {
            q: debouncedQ,
            customerUserId,
            paymentStatus: 'open',
            page: 1,
            limit: 30,
        },
        !disabled && !selectedBooking,
    )

    const results = data?.items ?? []

    useEffect(() => {
        setHighlight(0)
    }, [debouncedQ, results.length])

    const pick = (booking: Booking) => {
        onChange(booking.id, booking)
        setQ('')
        setDebouncedQ('')
        setOpen(false)
    }

    const clear = () => {
        onChange('', null)
        setQ('')
        setDebouncedQ('')
        setOpen(false)
        window.requestAnimationFrame(() => inputRef.current?.focus())
    }

    if (selectedBooking || value) {
        if (!selectedBooking) {
            return (
                <div className="rounded-[3px] border border-admin-border bg-admin-surface px-3 py-2.5">
                    <p className="text-sm text-ink/50">Loading booking…</p>
                </div>
            )
        }

        return (
            <div className="flex items-start gap-3 rounded-[3px] border border-admin-border bg-admin-surface px-3 py-2.5">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{selectedBooking.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ink/55">
                        {[selectedBooking.customer?.displayName, selectedBooking.quotation?.number]
                            .filter(Boolean)
                            .join(' · ') || 'No customer'}
                    </p>
                    <p className="mt-1 text-xs text-ink/55">
                        {PAYMENT_STATUS_LABELS[selectedBooking.paymentStatus]} · Remaining{' '}
                        {selectedBooking.remaining}
                        {selectedBooking.isOverdue ? ' · Overdue' : ''}
                    </p>
                </div>
                {!disabled ? (
                    <button
                        type="button"
                        className="rounded-[3px] p-1 text-ink/45 transition hover:bg-royal/[0.06] hover:text-royal"
                        onClick={clear}
                        aria-label="Clear booking"
                    >
                        <X size={15} strokeWidth={1.75} />
                    </button>
                ) : null}
            </div>
        )
    }

    const showList = open && !disabled

    return (
        <div className="relative">
            <div className="relative">
                <Search
                    size={15}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                    aria-hidden
                />
                <input
                    ref={inputRef}
                    type="search"
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        showList && results[highlight] ? `${listId}-option-${results[highlight].id}` : undefined
                    }
                    disabled={disabled}
                    value={q}
                    autoComplete="off"
                    placeholder="Search booking, quote number, or customer"
                    className={`${fieldClass} pl-9`}
                    onChange={(event) => {
                        setQ(event.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        window.setTimeout(() => setOpen(false), 150)
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault()
                            setOpen(false)
                            return
                        }
                        if (!showList || results.length === 0) {
                            if (event.key === 'Enter') event.preventDefault()
                            return
                        }
                        if (event.key === 'ArrowDown') {
                            event.preventDefault()
                            setHighlight((prev) => Math.min(prev + 1, results.length - 1))
                            return
                        }
                        if (event.key === 'ArrowUp') {
                            event.preventDefault()
                            setHighlight((prev) => Math.max(prev - 1, 0))
                            return
                        }
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            const option = results[highlight]
                            if (option) pick(option)
                        }
                    }}
                />
            </div>

            {showList ? (
                <ul
                    id={listId}
                    role="listbox"
                    className={`absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-[3px] border border-admin-border bg-admin-surface py-1 shadow-[0_12px_28px_rgba(15,19,26,0.14)] transition-opacity ${
                        isFetching ? 'opacity-70' : ''
                    }`}
                >
                    {isPending && results.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-ink/50">Loading bookings…</li>
                    ) : results.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-ink/50">No open bookings match.</li>
                    ) : (
                        results.map((booking, index) => {
                            const active = index === highlight
                            return (
                                <li key={booking.id} role="presentation">
                                    <button
                                        type="button"
                                        id={`${listId}-option-${booking.id}`}
                                        role="option"
                                        aria-selected={active}
                                        className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition ${
                                            active ? 'bg-royal/[0.08]' : 'hover:bg-royal/[0.04]'
                                        }`}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => setHighlight(index)}
                                        onClick={() => pick(booking)}
                                    >
                                        <span className="truncate text-sm font-medium text-ink">
                                            {booking.title}
                                        </span>
                                        <span className="truncate text-xs text-ink/55">
                                            {[booking.customer?.displayName, booking.quotation?.number]
                                                .filter(Boolean)
                                                .join(' · ') || 'No customer'}
                                        </span>
                                        <span className="truncate text-xs text-ink/45">
                                            {PAYMENT_STATUS_LABELS[booking.paymentStatus]} · Remaining{' '}
                                            {booking.remaining}
                                            {booking.isOverdue ? ' · Overdue' : ''}
                                        </span>
                                    </button>
                                </li>
                            )
                        })
                    )}
                </ul>
            ) : null}
        </div>
    )
}
