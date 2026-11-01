type Metric = {
    label: string
    value: string
}

type CustomerMetricsProps = {
    metrics: Metric[]
    loading?: boolean
}

export default function CustomerMetrics({ metrics, loading }: CustomerMetricsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-3 border-t border-royal/10 pt-4 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1.5">
                        <div className="h-3 w-16 skeleton-shimmer rounded-[3px]" />
                        <div className="h-6 w-12 skeleton-shimmer rounded-[3px]" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-3 border-t border-royal/10 pt-4 sm:grid-cols-4">
            {metrics.map((metric) => (
                <div key={metric.label}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/45">
                        {metric.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{metric.value}</p>
                </div>
            ))}
        </div>
    )
}
