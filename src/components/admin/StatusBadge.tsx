import type { ReactNode } from 'react'

const TONES = {
    neutral: 'bg-admin-border/50 text-ink/65',
    accent: 'bg-royal/10 text-royal',
    success: 'bg-emerald-600/15 text-emerald-700',
    warning: 'bg-amber-500/15 text-amber-800',
    danger: 'bg-red-600/15 text-red-700',
} as const

export type StatusTone = keyof typeof TONES

export default function StatusBadge({
    children,
    tone = 'neutral',
    className = '',
}: {
    children: ReactNode
    tone?: StatusTone
    className?: string
}) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TONES[tone]} ${className}`}
        >
            {children}
        </span>
    )
}
