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
        <main className="flex min-h-svh items-center justify-center bg-admin-bg px-4 py-12 font-poppins">
            <div className="w-full max-w-sm">
                <div className="flex justify-center">
                    <BrandWordmark className="text-2xl" />
                </div>
                <div className="admin-panel mt-6 rounded-[3px] p-6">
                    <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
                    {description && <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{description}</p>}
                    <div className="mt-5">{children}</div>
                </div>
            </div>
        </main>
    )
}
