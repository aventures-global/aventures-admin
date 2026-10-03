import { ChevronDown, X } from 'lucide-react'
import type { Faq } from '../../../types/faq'
import IconButton from './IconButton'

type TopFaqQueueProps = {
    queue: Faq[]
    limit: number
    candidates: Faq[]
    busy: boolean
    onAdd: (faq: Faq) => void
    onRemove: (faq: Faq) => void
}

export default function TopFaqQueue({ queue, limit, candidates, busy, onAdd, onRemove }: TopFaqQueueProps) {
    const emptySlots = Math.max(0, limit - queue.length)

    return (
        <section
            aria-labelledby="top-faq-heading"
            className="paper-card rounded-[3px] p-4 sm:p-5"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="top-faq-heading" className="font-noto-serif text-xl text-ink">
                        Showing beside the contact form
                    </h2>
                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink/60">
                        Up to {limit} FAQs, in this order on the homepage. A newly added FAQ goes last;
                        when all {limit} slots are full, the FAQ in slot 1 is removed.
                    </p>
                </div>
                <span className="rounded-full border border-royal/20 px-2.5 py-1 text-xs tabular-nums text-royal">
                    {queue.length} / {limit}
                </span>
            </div>

            <ol className="mt-4 space-y-1.5">
                {queue.map((faq, index) => (
                    <li
                        key={faq.id}
                        className="flex items-center gap-3 rounded-[3px] border border-royal/10 bg-cream px-3 py-2"
                    >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-royal text-xs tabular-nums text-cream">
                            {index + 1}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-sm text-ink" title={faq.question}>
                            {faq.question}
                        </p>
                        {index === 0 && queue.length >= limit ? (
                            <span className="hidden shrink-0 text-[11px] text-ink/45 sm:inline">
                                Removed next
                            </span>
                        ) : null}
                        <IconButton
                            label={`Remove “${faq.question}” from the contact form`}
                            disabled={busy}
                            onClick={() => onRemove(faq)}
                        >
                            <X size={15} strokeWidth={1.75} />
                        </IconButton>
                    </li>
                ))}
                {Array.from({ length: emptySlots }, (_, i) => (
                    <li
                        key={`empty-${i}`}
                        className="flex items-center gap-3 rounded-[3px] border border-dashed border-royal/20 px-3 py-2 text-sm text-ink/40"
                    >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-royal/20 text-xs tabular-nums">
                            {queue.length + i + 1}
                        </span>
                        Empty slot
                    </li>
                ))}
            </ol>

            <div className="relative mt-4">
                <select
                    aria-label="Add an FAQ to the contact form"
                    value=""
                    disabled={busy || candidates.length === 0}
                    onChange={(event) => {
                        const faq = candidates.find((item) => item.id === event.target.value)
                        if (faq) onAdd(faq)
                    }}
                    className="h-9 w-full cursor-pointer appearance-none rounded-[3px] border border-royal/25 bg-white/80 pr-8 pl-3 text-sm text-ink outline-none transition focus:border-royal disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <option value="" disabled>
                        {candidates.length === 0 ? 'Every FAQ is already shown' : 'Add an FAQ to the end…'}
                    </option>
                    {candidates.map((faq) => (
                        <option key={faq.id} value={faq.id}>
                            {faq.question}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={14}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-royal/70"
                    aria-hidden
                />
            </div>
        </section>
    )
}
