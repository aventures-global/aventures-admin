import { ArrowDown, ArrowUp, X } from 'lucide-react'

type ItemControlsProps = {
    index: number
    count: number
    label: string
    onMove: (from: number, to: number) => void
    onRemove: (index: number) => void
    canRemove?: boolean
    /** `light` sits on cream previews and stays visible instead of revealing on hover. */
    tone?: 'dark' | 'light'
    className?: string
}

const controlClass = {
    dark: 'flex h-6 w-6 items-center justify-center rounded-md text-silver/50 transition hover:bg-white/5 hover:text-gold disabled:pointer-events-none disabled:opacity-30',
    light: 'flex h-7 w-7 items-center justify-center rounded-full text-royal/60 transition hover:bg-royal/5 hover:text-royal disabled:pointer-events-none disabled:opacity-30',
}

const wrapperClass = {
    dark: 'opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
    light: 'rounded-full border border-royal/15 bg-white/85 p-0.5 shadow-sm',
}

const removeHover = { dark: 'hover:text-red-300', light: 'hover:text-red-700' }

export default function ItemControls({
    index,
    count,
    label,
    onMove,
    onRemove,
    canRemove = true,
    tone = 'dark',
    className = '',
}: ItemControlsProps) {
    const iconSize = tone === 'light' ? 14 : 13
    return (
        <div className={`flex shrink-0 items-center gap-0.5 ${wrapperClass[tone]} ${className}`}>
            <button
                type="button"
                aria-label={`Move ${label} up`}
                title={`Move ${label} up`}
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
                className={controlClass[tone]}
            >
                <ArrowUp size={iconSize} strokeWidth={1.75} />
            </button>
            <button
                type="button"
                aria-label={`Move ${label} down`}
                title={`Move ${label} down`}
                disabled={index === count - 1}
                onClick={() => onMove(index, index + 1)}
                className={controlClass[tone]}
            >
                <ArrowDown size={iconSize} strokeWidth={1.75} />
            </button>
            <button
                type="button"
                aria-label={`Remove ${label}`}
                title={canRemove ? `Remove ${label}` : 'At least one is required'}
                disabled={!canRemove}
                onClick={() => onRemove(index)}
                className={`${controlClass[tone]} ${removeHover[tone]}`}
            >
                <X size={iconSize + 1} strokeWidth={1.75} />
            </button>
        </div>
    )
}
