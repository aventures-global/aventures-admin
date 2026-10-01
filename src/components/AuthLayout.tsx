import type { ReactNode } from 'react'
import BrandWordmark from './BrandWordmark'

export default function AuthLayout({
    title,
    description,
    children,
}: {
    title: string
    description?: ReactNode
    children: ReactNode
}) {
    return (
        <main className="flex min-h-svh items-center justify-center bg-ink px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="flex justify-center">
                    <BrandWordmark />
                </div>
                <div className="card-surface mt-5 rounded-xl border border-white/10 p-6 shadow-xl shadow-black/40">
                    <h1 className="font-serif text-2xl text-gold-gradient">{title}</h1>
                    {description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-silver/70">{description}</p>
                    )}
                    <div className="mt-5">{children}</div>
                </div>
            </div>
        </main>
    )
}
