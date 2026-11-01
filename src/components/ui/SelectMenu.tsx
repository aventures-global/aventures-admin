import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { fieldClass } from '../../lib/formStyles'

export type SelectOption<T extends string = string> = {
    value: T
    label: string
}

export default function SelectMenu<T extends string>({
    value,
    options,
    onChange,
    disabled = false,
    'aria-label': ariaLabel,
    className = '',
}: {
    value: T
    options: SelectOption<T>[]
    onChange: (value: T) => void
    disabled?: boolean
    'aria-label'?: string
    className?: string
}) {
    const listId = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const selectedIndex = Math.max(
        0,
        options.findIndex((option) => option.value === value),
    )
    const [highlight, setHighlight] = useState(selectedIndex)
    const selected = options.find((option) => option.value === value) ?? options[0]

    useEffect(() => {
        if (!open) return
        setHighlight(selectedIndex)
    }, [open, selectedIndex])

    useEffect(() => {
        if (!open) return
        const onPointer = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        window.addEventListener('mousedown', onPointer)
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('mousedown', onPointer)
            window.removeEventListener('keydown', onKey)
        }
    }, [open])

    const pick = (next: T) => {
        onChange(next)
        setOpen(false)
    }

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                className={`${fieldClass} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
                onClick={() => setOpen((prev) => !prev)}
                onKeyDown={(event) => {
                    if (disabled) return
                    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setOpen(true)
                    }
                }}
            >
                <span className="truncate">{selected?.label ?? 'Select…'}</span>
                <ChevronDown
                    size={15}
                    strokeWidth={1.75}
                    className={`shrink-0 text-ink/45 transition ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                />
            </button>

            {open ? (
                <ul
                    id={listId}
                    role="listbox"
                    aria-activedescendant={`${listId}-option-${options[highlight]?.value ?? ''}`}
                    className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-[3px] border border-admin-border bg-admin-surface py-1 shadow-[0_12px_28px_rgba(15,19,26,0.14)]"
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') {
                            event.preventDefault()
                            setHighlight((prev) => Math.min(prev + 1, options.length - 1))
                        } else if (event.key === 'ArrowUp') {
                            event.preventDefault()
                            setHighlight((prev) => Math.max(prev - 1, 0))
                        } else if (event.key === 'Enter') {
                            event.preventDefault()
                            const option = options[highlight]
                            if (option) pick(option.value)
                        }
                    }}
                >
                    {options.map((option, index) => {
                        const active = option.value === value
                        const highlighted = index === highlight
                        return (
                            <li key={option.value} role="presentation">
                                <button
                                    type="button"
                                    id={`${listId}-option-${option.value}`}
                                    role="option"
                                    aria-selected={active}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                                        highlighted ? 'bg-royal/[0.08]' : 'hover:bg-royal/[0.04]'
                                    }`}
                                    onMouseEnter={() => setHighlight(index)}
                                    onClick={() => pick(option.value)}
                                >
                                    <span className={active ? 'font-medium text-ink' : 'text-ink/80'}>
                                        {option.label}
                                    </span>
                                    {active ? (
                                        <Check size={14} strokeWidth={2} className="shrink-0 text-royal" />
                                    ) : null}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : null}
        </div>
    )
}
