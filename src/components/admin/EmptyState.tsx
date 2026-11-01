import type { ReactNode } from 'react'

export default function EmptyState({
    title,
    body,
    action,
}: {
    title: string
    body?: ReactNode
    action?: ReactNode
}) {
    return (
        <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-ink">{title}</p>
            {body ? <p className="mx-auto mt-1 max-w-md text-sm text-ink/55">{body}</p> : null}
            {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
        </div>
    )
}
