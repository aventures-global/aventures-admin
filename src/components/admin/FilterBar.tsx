import type { ReactNode } from 'react'

export default function FilterBar({
    children,
    actions,
    className = '',
}: {
    children: ReactNode
    actions?: ReactNode
    className?: string
}) {
    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
    )
}
