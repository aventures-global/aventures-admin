import { Plus } from 'lucide-react'

type AddItemButtonProps = {
    label: string
    onClick: () => void
    tone?: 'dark' | 'light'
    className?: string
}

const toneClass = {
    dark: 'rounded-lg border-white/15 px-3 py-1.5 text-xs text-silver/70 hover:border-gold/50 hover:text-gold',
    light: 'rounded-full border-royal/30 bg-white/60 px-4 py-2 text-sm text-royal/80 hover:border-royal hover:bg-white hover:text-royal',
}

export default function AddItemButton({ label, onClick, tone = 'dark', className = '' }: AddItemButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 border border-dashed transition ${toneClass[tone]} ${className}`}
        >
            <Plus size={tone === 'light' ? 15 : 13} strokeWidth={1.75} aria-hidden />
            {label}
        </button>
    )
}
