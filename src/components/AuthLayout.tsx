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
        <main className="luxury-paper flex min-h-svh items-center justify-center px-4 py-12 font-poppins">
            <div className="w-full max-w-sm">
                <div className="flex justify-center">
                    <BrandWordmark className="text-2xl" />
                </div>
                <div className="paper-card mt-6 rounded-[3px] p-6">
                    <h1 className="font-noto-serif text-2xl text-ink">{title}</h1>
                    {description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{description}</p>
                    )}
                    <div className="mt-5">{children}</div>
                </div>
            </div>
        </main>
    )
}
