import { ArrowDown, ArrowUp, X } from 'lucide-react'

type ItemControlsProps = {
    index: number
    count: number
    label: string
    onMove: (from: number, to: number) => void
    onRemove: (index: number) => void
    className?: string
}

const controlClass =
    'flex h-6 w-6 items-center justify-center rounded-md text-silver/50 transition hover:bg-white/5 hover:text-gold disabled:pointer-events-none disabled:opacity-30'

export default function ItemControls({
    index,
    count,
    label,
    onMove,
    onRemove,
    className = '',
}: ItemControlsProps) {
    return (
        <div
            className={`flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${className}`}
        >
            <button
                type="button"
                aria-label={`Move ${label} up`}
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
                className={controlClass}
            >
                <ArrowUp size={13} strokeWidth={1.75} />
            </button>
            <button
                type="button"
                aria-label={`Move ${label} down`}
                disabled={index === count - 1}
                onClick={() => onMove(index, index + 1)}
                className={controlClass}
            >
                <ArrowDown size={13} strokeWidth={1.75} />
            </button>
            <button
                type="button"
                aria-label={`Remove ${label}`}
                onClick={() => onRemove(index)}
                className={`${controlClass} hover:text-red-300`}
            >
                <X size={14} strokeWidth={1.75} />
            </button>
        </div>
    )
}
