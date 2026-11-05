import { useMemo, useState } from 'react'
import SelectMenu from '../ui/SelectMenu'
import {
    fieldClass,
    ghostActionClass,
    labelClass,
    primaryActionClass,
} from '../../lib/formStyles'
import { centsFromMajor } from '../../services/paymentService'
import type { FinanceCategory, FinanceEntryType } from '../../services/financeService'

type FinanceEntryFormProps = {
    categories: FinanceCategory[]
    busy?: boolean
    onSubmit: (input: {
        type: FinanceEntryType
        categoryId: string
        amountCents: number
        currency: string
        occurredAt: string
        description: string
        notes: string | null
    }) => void
    onCancel?: () => void
}

function todayInputValue() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function FinanceEntryForm({
    categories,
    busy,
    onSubmit,
    onCancel,
}: FinanceEntryFormProps) {
    const [type, setType] = useState<FinanceEntryType>('EXPENSE')
    const [categoryId, setCategoryId] = useState('')
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [occurredAt, setOccurredAt] = useState(todayInputValue())
    const [description, setDescription] = useState('')
    const [notes, setNotes] = useState('')

    const available = useMemo(
        () => categories.filter((category) => category.type === type && !category.isSystem && !category.archivedAt),
        [categories, type],
    )

    const handleTypeChange = (next: FinanceEntryType) => {
        setType(next)
        setCategoryId('')
    }

    const categoryOptions = useMemo(
        () => [
            { value: '', label: available.length ? 'Select category' : 'No categories available' },
            ...available.map((category) => ({ value: category.id, label: category.name })),
        ],
        [available],
    )

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault()
                const amountCents = centsFromMajor(amount)
                if (!categoryId || amountCents <= 0 || !description.trim()) return
                onSubmit({
                    type,
                    categoryId,
                    amountCents,
                    currency,
                    occurredAt: new Date(`${occurredAt}T12:00:00`).toISOString(),
                    description: description.trim(),
                    notes: notes.trim() || null,
                })
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <span className={labelClass}>Type</span>
                    <SelectMenu
                        value={type}
                        aria-label="Entry type"
                        disabled={busy}
                        onChange={handleTypeChange}
                        options={[
                            { value: 'INCOME', label: 'Income' },
                            { value: 'EXPENSE', label: 'Expense' },
                        ]}
                    />
                </div>
                <div>
                    <span className={labelClass}>Category</span>
                    <SelectMenu
                        value={categoryId}
                        aria-label="Category"
                        disabled={busy || available.length === 0}
                        onChange={setCategoryId}
                        options={categoryOptions}
                    />
                </div>
                <div>
                    <label className={labelClass} htmlFor="entry-amount">
                        Amount
                    </label>
                    <input
                        id="entry-amount"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className={fieldClass}
                        inputMode="decimal"
                        required
                        disabled={busy}
                    />
                </div>
                <div>
                    <span className={labelClass}>Currency</span>
                    <SelectMenu
                        value={currency}
                        aria-label="Currency"
                        disabled={busy}
                        onChange={setCurrency}
                        options={[
                            { value: 'USD', label: 'USD' },
                            { value: 'PHP', label: 'PHP' },
                        ]}
                    />
                </div>
                <div>
                    <label className={labelClass} htmlFor="entry-date">
                        Date
                    </label>
                    <input
                        id="entry-date"
                        type="date"
                        value={occurredAt}
                        onChange={(event) => setOccurredAt(event.target.value)}
                        className={fieldClass}
                        required
                        disabled={busy}
                    />
                </div>
                <div>
                    <label className={labelClass} htmlFor="entry-description">
                        Description
                    </label>
                    <input
                        id="entry-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className={fieldClass}
                        required
                        disabled={busy}
                    />
                </div>
            </div>
            <div>
                <label className={labelClass} htmlFor="entry-notes">
                    Notes
                </label>
                <textarea
                    id="entry-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className={`${fieldClass} min-h-20`}
                    disabled={busy}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <button type="submit" className={primaryActionClass} disabled={busy}>
                    {busy ? 'Saving…' : 'Save entry'}
                </button>
                {onCancel ? (
                    <button type="button" className={ghostActionClass} disabled={busy} onClick={onCancel}>
                        Cancel
                    </button>
                ) : null}
            </div>
        </form>
    )
}
