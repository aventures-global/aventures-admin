import { Plus } from 'lucide-react'

type AddItemButtonProps = {
    label: string
    onClick: () => void
    className?: string
}

export default function AddItemButton({ label, onClick, className = '' }: AddItemButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-1.5 text-xs text-silver/70 transition hover:border-gold/50 hover:text-gold ${className}`}
        >
            <Plus size={13} strokeWidth={1.75} aria-hidden />
            {label}
        </button>
    )
}
