import type { ReactNode } from 'react'

type IconButtonProps = {
    label: string
    onClick?: () => void
    children: ReactNode
    type?: 'button' | 'submit'
    disabled?: boolean
    tone?: 'default' | 'danger'
}

export default function IconButton({
    label,
    onClick,
    children,
    type = 'button',
    disabled,
    tone = 'default',
}: IconButtonProps) {
    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] text-ink/50 transition disabled:opacity-50 ${
                tone === 'danger' ? 'hover:bg-red-50 hover:text-red-700' : 'hover:bg-royal/5 hover:text-royal'
            }`}
        >
            {children}
        </button>
    )
}
