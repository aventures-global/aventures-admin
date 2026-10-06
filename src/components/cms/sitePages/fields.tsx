import { useId, type ReactNode } from 'react'
import { fieldClass, labelClass } from '../../../lib/formStyles'
import { moveItem } from '../../../lib/listOps'
import type { TitledItem } from '../../../types/sitePages'
import AddItemButton from '../AddItemButton'
import ItemControls from '../ItemControls'

const invalidClass = 'border-red-700/50 bg-red-50/40'

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <section className="paper-card space-y-4 rounded-[3px] p-4 sm:p-5">
            <div>
                <h2 className="font-noto-serif text-lg text-royal">{title}</h2>
                {description ? <p className="mt-0.5 text-xs text-ink/55">{description}</p> : null}
            </div>
            {children}
        </section>
    )
}

type TextFieldProps = {
    label: string
    value: string
    onChange: (value: string) => void
    rows?: number
    hint?: ReactNode
    showErrors?: boolean
    optional?: boolean
    maxLength?: number
}

export function TextField({ label, value, onChange, rows, hint, showErrors, optional, maxLength }: TextFieldProps) {
    const id = useId()
    const invalid = showErrors && !optional && !value.trim()
    const className = `${fieldClass} ${invalid ? invalidClass : ''}`
    return (
        <div>
            <label className={labelClass} htmlFor={id}>
                {label}
            </label>
            {rows ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    rows={rows}
                    maxLength={maxLength}
                    aria-invalid={invalid || undefined}
                    className={`${className} resize-y leading-relaxed`}
                />
            ) : (
                <input
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    maxLength={maxLength}
                    aria-invalid={invalid || undefined}
                    className={className}
                />
            )}
            {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
        </div>
    )
}

export function MarkdownHint() {
    return (
        <>
            Blank line for a new paragraph · <code>- </code> for bullets · <code>**bold**</code> ·{' '}
            <code>[text](/page or https://…)</code> · <code>{'{email}'}</code> <code>{'{phone}'}</code>{' '}
            <code>{'{address}'}</code> <code>{'{fullName}'}</code> fill in the site contact details
        </>
    )
}

type ListFieldProps = {
    label: string
    itemLabel: string
    items: string[]
    onChange: (items: string[]) => void
    showErrors?: boolean
}

export function ListField({ label, itemLabel, items, onChange, showErrors }: ListFieldProps) {
    return (
        <fieldset>
            <legend className={labelClass}>{label}</legend>
            <ol className="space-y-2">
                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-right text-xs tabular-nums text-ink/40">{index + 1}</span>
                        <input
                            value={item}
                            aria-label={`${itemLabel} ${index + 1}`}
                            onChange={(event) => onChange(items.map((v, i) => (i === index ? event.target.value : v)))}
                            className={`${fieldClass} ${showErrors && !item.trim() ? invalidClass : ''}`}
                        />
                        <ItemControls
                            tone="light"
                            index={index}
                            count={items.length}
                            label={`${itemLabel} ${index + 1}`}
                            canRemove={items.length > 1}
                            onMove={(from, to) => onChange(moveItem(items, from, to))}
                            onRemove={(i) => onChange(items.filter((_, j) => j !== i))}
                        />
                    </li>
                ))}
            </ol>
            <AddItemButton tone="light" label={`Add ${itemLabel.toLowerCase()}`} onClick={() => onChange([...items, ''])} className="mt-3" />
        </fieldset>
    )
}

type TitledListFieldProps = {
    label: string
    itemLabel: string
    items: TitledItem[]
    onChange: (items: TitledItem[]) => void
    showErrors?: boolean
}

export function TitledListField({ label, itemLabel, items, onChange, showErrors }: TitledListFieldProps) {
    const update = (index: number, patch: Partial<TitledItem>) =>
        onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
    return (
        <fieldset>
            <legend className={labelClass}>{label}</legend>
            <ol className="space-y-3">
                {items.map((item, index) => (
                    <li key={index} className="rounded-[3px] border border-royal/10 bg-white/50 p-3">
                        <div className="flex items-start gap-2">
                            <div className="grid min-w-0 flex-1 gap-2">
                                <input
                                    value={item.title}
                                    aria-label={`${itemLabel} ${index + 1} title`}
                                    placeholder="Title"
                                    onChange={(event) => update(index, { title: event.target.value })}
                                    className={`${fieldClass} ${showErrors && !item.title.trim() ? invalidClass : ''}`}
                                />
                                <textarea
                                    value={item.description}
                                    aria-label={`${itemLabel} ${index + 1} description`}
                                    placeholder="Description"
                                    rows={2}
                                    onChange={(event) => update(index, { description: event.target.value })}
                                    className={`${fieldClass} resize-y leading-relaxed ${showErrors && !item.description.trim() ? invalidClass : ''}`}
                                />
                            </div>
                            <ItemControls
                                tone="light"
                                index={index}
                                count={items.length}
                                label={`${itemLabel} ${index + 1}`}
                                canRemove={items.length > 1}
                                onMove={(from, to) => onChange(moveItem(items, from, to))}
                                onRemove={(i) => onChange(items.filter((_, j) => j !== i))}
                            />
                        </div>
                    </li>
                ))}
            </ol>
            <AddItemButton
                tone="light"
                label={`Add ${itemLabel.toLowerCase()}`}
                onClick={() => onChange([...items, { title: '', description: '' }])}
                className="mt-3"
            />
        </fieldset>
    )
}
