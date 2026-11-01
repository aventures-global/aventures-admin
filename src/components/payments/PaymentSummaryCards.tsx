import type { PaymentSummary } from '../../services/paymentService'

type PaymentSummaryCardsProps = {
    summary?: PaymentSummary
    loading?: boolean
}

export default function PaymentSummaryCards({ summary, loading }: PaymentSummaryCardsProps) {
    const cards = [
        { label: 'Collected', value: summary?.collected ?? '—' },
        { label: 'Payments', value: summary ? String(summary.paymentCount) : '—' },
        { label: 'Outstanding', value: summary?.outstanding ?? '—' },
        { label: 'Overdue bookings', value: summary ? String(summary.overdueCount) : '—' },
    ]

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <div key={card.label} className="admin-panel rounded-[3px] p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink/45">{card.label}</p>
                    {loading ? (
                        <div className="mt-2 h-7 skeleton-shimmer rounded-[3px]" />
                    ) : (
                        <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{card.value}</p>
                    )}
                </div>
            ))}
        </div>
    )
}
