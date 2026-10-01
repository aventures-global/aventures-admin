import { useRef, useState, type ElementType, type KeyboardEvent } from 'react'

type EditableTextProps = {
    value: string
    onChange: (value: string) => void
    /** Accessible name, also shown as a tooltip. */
    label: string
    placeholder?: string
    multiline?: boolean
    /** Typography classes shared by the display element and the input. */
    className?: string
    as?: ElementType
    invalid?: boolean
    /** Start in edit mode, e.g. for a freshly added list item. */
    autoEdit?: boolean
    onEditEnd?: (value: string) => void
}

const idleRing =
    'cursor-text rounded-md outline-1 outline-dashed outline-offset-4 transition-[outline-color] hover:outline-gold/60 focus-visible:outline-gold'

export default function EditableText({
    value,
    onChange,
    label,
    placeholder = 'Click to edit',
    multiline = false,
    className = '',
    as: Tag = 'p',
    invalid = false,
    autoEdit = false,
    onEditEnd,
}: EditableTextProps) {
    const [editing, setEditing] = useState(autoEdit)
    const initialRef = useRef(value)

    const start = () => {
        initialRef.current = value
        setEditing(true)
    }

    const finish = (next: string) => {
        setEditing(false)
        onEditEnd?.(next)
    }

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault()
            onChange(initialRef.current)
            finish(initialRef.current)
        } else if (event.key === 'Enter' && (!multiline || event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            finish(value)
        }
    }

    const ring = invalid ? 'outline-red-400/80' : 'outline-transparent'

    if (editing) {
        const inputClass = `${className} block w-full min-w-0 resize-none border-0 bg-black/30 p-0 rounded-md outline-1 outline-offset-4 outline-gold placeholder:text-current placeholder:opacity-40 [field-sizing:content]`
        return multiline ? (
            <textarea
                autoFocus
                aria-label={label}
                value={value}
                placeholder={placeholder}
                rows={2}
                onChange={(event) => onChange(event.target.value)}
                onBlur={() => finish(value)}
                onKeyDown={onKeyDown}
                className={inputClass}
            />
        ) : (
            <input
                autoFocus
                aria-label={label}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                onBlur={() => finish(value)}
                onKeyDown={onKeyDown}
                className={inputClass}
            />
        )
    }

    return (
        <Tag
            role="button"
            tabIndex={0}
            title={`Edit ${label.toLowerCase()}`}
            aria-label={`Edit ${label.toLowerCase()}`}
            onClick={start}
            onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    start()
                }
            }}
            className={`${className} ${idleRing} ${ring} ${multiline ? 'whitespace-pre-line' : ''}`}
        >
            {value || <span className="italic opacity-40">{placeholder}</span>}
        </Tag>
    )
}
