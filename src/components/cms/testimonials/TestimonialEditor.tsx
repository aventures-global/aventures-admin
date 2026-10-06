import { Star } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { fieldClass, labelClass } from '../../../lib/formStyles'
import type { TestimonialInput } from '../../../services/testimonialService'

type TestimonialEditorProps = {
    initial?: TestimonialInput
    submitLabel: string
    busy: boolean
    onSubmit: (input: TestimonialInput) => void
    onCancel: () => void
}

const EMPTY: TestimonialInput = { quote: '', name: '', trip: '', rating: 5 }

export default function TestimonialEditor({
    initial = EMPTY,
    submitLabel,
    busy,
    onSubmit,
    onCancel,
}: TestimonialEditorProps) {
    const [quote, setQuote] = useState(initial.quote)
    const [name, setName] = useState(initial.name)
    const [trip, setTrip] = useState(initial.trip)
    const [rating, setRating] = useState(initial.rating)
    const canSave = quote.trim().length > 0 && name.trim().length > 0 && trip.trim().length > 0

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (!canSave) return
        onSubmit({ quote: quote.trim(), name: name.trim(), trip: trip.trim(), rating })
    }

    return (
        <form
            onSubmit={submit}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && !busy) onCancel()
            }}
            className="space-y-4"
        >
            <div>
                <label className={labelClass} htmlFor="testimonial-quote">
                    Quote
                </label>
                <textarea
                    id="testimonial-quote"
                    autoFocus
                    value={quote}
                    onChange={(event) => setQuote(event.target.value)}
                    rows={4}
                    maxLength={1000}
                    className={`${fieldClass} min-h-24 resize-y leading-relaxed`}
                />
                <p className="mt-1 text-xs text-ink/50">Only publish quotes the client has approved.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass} htmlFor="testimonial-name">
                        Client name
                    </label>
                    <input
                        id="testimonial-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={120}
                        placeholder="Maria L."
                        className={fieldClass}
                    />
                </div>
                <div>
                    <label className={labelClass} htmlFor="testimonial-trip">
                        Trip or destination
                    </label>
                    <input
                        id="testimonial-trip"
                        value={trip}
                        onChange={(event) => setTrip(event.target.value)}
                        maxLength={120}
                        placeholder="Boracay Serenity"
                        className={fieldClass}
                    />
                </div>
            </div>
            <fieldset>
                <legend className={labelClass}>Rating</legend>
                <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={rating === value}
                            aria-label={`${value} star${value === 1 ? '' : 's'}`}
                            onClick={() => setRating(value)}
                            className="rounded p-0.5 transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:outline-none"
                        >
                            <Star
                                size={20}
                                strokeWidth={1.5}
                                className={value <= rating ? 'fill-gold-deep text-gold-deep' : 'text-royal/25'}
                                aria-hidden
                            />
                        </button>
                    ))}
                </div>
            </fieldset>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    className="rounded-[3px] border border-royal/25 px-3.5 py-1.5 text-sm text-ink/75 transition hover:border-royal hover:text-royal disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!canSave || busy}
                    className="btn-royal rounded-[3px] px-3.5 py-1.5 text-sm disabled:opacity-60"
                >
                    {busy ? 'Saving…' : submitLabel}
                </button>
            </div>
        </form>
    )
}
