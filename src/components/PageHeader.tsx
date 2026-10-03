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
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                {eyebrow ? (
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">{eyebrow}</p>
                ) : null}
                <h1 className="mt-2 font-noto-serif text-3xl text-ink sm:text-4xl">{title}</h1>
                {description ? (
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/60">{description}</p>
                ) : null}
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
    )
}
