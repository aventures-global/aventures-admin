import type { ReactNode } from 'react'

export default function PageHeader({
    title,
    eyebrow,
    description,
    actions,
}: {
    title: string
    eyebrow?: string
    description?: ReactNode
    actions?: ReactNode
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
                {eyebrow ? <p className="text-xs font-medium text-ink/50">{eyebrow}</p> : null}
                <h1 className={`text-xl font-semibold tracking-tight text-ink ${eyebrow ? 'mt-0.5' : ''}`}>{title}</h1>
                {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
    )
}
