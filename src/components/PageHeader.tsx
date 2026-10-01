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
                {eyebrow ? <p className="text-xs text-gold">{eyebrow}</p> : null}
                <h1 className="mt-1 font-serif text-2xl text-gold-gradient sm:text-3xl">{title}</h1>
                {description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-silver/70">
                        {description}
                    </p>
                ) : null}
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
    )
}
