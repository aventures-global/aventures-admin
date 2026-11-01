import type { ReactNode } from 'react'
import AdminPanel from './AdminPanel'
import EmptyState from './EmptyState'

export default function DataTable({
    children,
    minWidth,
    loading,
    empty,
    emptyTitle = 'Nothing here yet',
    emptyBody,
    emptyAction,
    className = '',
}: {
    children: ReactNode
    minWidth?: string
    loading?: boolean
    empty?: boolean
    emptyTitle?: string
    emptyBody?: ReactNode
    emptyAction?: ReactNode
    className?: string
}) {
    if (loading) {
        return (
            <AdminPanel className={`overflow-hidden ${className}`}>
                <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton-paper h-9 rounded-[3px]" />
                    ))}
                </div>
            </AdminPanel>
        )
    }

    if (empty) {
        return (
            <AdminPanel className={className}>
                <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />
            </AdminPanel>
        )
    }

    return (
        <AdminPanel className={`overflow-x-auto ${className}`}>
            <table className="w-full text-left text-sm" style={minWidth ? { minWidth } : undefined}>
                {children}
            </table>
        </AdminPanel>
    )
}

export function DataTableHead({ children }: { children: ReactNode }) {
    return (
        <thead className="border-b border-admin-border bg-admin-bg text-[11px] font-medium uppercase tracking-wide text-ink/50">
            {children}
        </thead>
    )
}

export function DataTableBody({ children }: { children: ReactNode }) {
    return <tbody className="divide-y divide-admin-border">{children}</tbody>
}
