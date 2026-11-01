import type { HTMLAttributes, ReactNode } from 'react'

export default function AdminPanel({
    children,
    className = '',
    ...rest
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`admin-panel rounded-[3px] ${className}`} {...rest}>
            {children}
        </div>
    )
}
