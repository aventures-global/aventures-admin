import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { fieldClass, labelClass } from '../../../lib/formStyles'
import type { FaqCategory, FaqInput } from '../../../types/faq'

type FaqEditorProps = {
    initial?: FaqInput
    categories: FaqCategory[]
    submitLabel: string
    busy: boolean
    onSubmit: (input: FaqInput) => void
    onCancel: () => void
}

const EMPTY: FaqInput = { question: '', answer: '', categoryIds: [] }

export default function FaqEditor({
    initial = EMPTY,
    categories,
    submitLabel,
    busy,
    onSubmit,
    onCancel,
}: FaqEditorProps) {
    const [question, setQuestion] = useState(initial.question)
    const [answer, setAnswer] = useState(initial.answer)
    const [categoryIds, setCategoryIds] = useState(initial.categoryIds)
    const canSave = question.trim().length > 0 && answer.trim().length > 0

    const toggle = (id: string) => {
        setCategoryIds((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        )
    }

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (!canSave) return
        onSubmit({ question: question.trim(), answer: answer.trim(), categoryIds })
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
                <label className={labelClass} htmlFor="faq-question">
                    Question
                </label>
                <input
                    id="faq-question"
                    autoFocus
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    maxLength={500}
                    className={fieldClass}
                />
            </div>
            <div>
                <label className={labelClass} htmlFor="faq-answer">
                    Answer
                </label>
                <textarea
                    id="faq-answer"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    rows={4}
                    maxLength={5000}
                    className={`${fieldClass} min-h-24 resize-y leading-relaxed`}
                />
            </div>
            <fieldset>
                <legend className={labelClass}>Categories</legend>
                {categories.length === 0 ? (
                    <p className="text-xs text-ink/50">
                        No categories yet. Add them in the Categories tab.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {categories.map((category) => {
                            const checked = categoryIds.includes(category.id)
                            return (
                                <label
                                    key={category.id}
                                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-royal/40 ${
                                        checked
                                            ? 'border-royal bg-royal text-cream'
                                            : 'border-royal/20 text-ink/70 hover:border-royal/50 hover:text-royal'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(category.id)}
                                        className="sr-only"
                                    />
                                    {checked ? <Check size={12} strokeWidth={2} aria-hidden /> : null}
                                    {category.name}
                                </label>
                            )
                        })}
                    </div>
                )}
                {categories.length > 0 && categoryIds.length === 0 ? (
                    <p className="mt-2 text-xs text-ink/50">
                        Without a category, this FAQ stays off the FAQ page. It can still appear beside
                        the contact form.
                    </p>
                ) : null}
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
