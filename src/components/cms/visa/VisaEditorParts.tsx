import { Info, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function FixedBadge({ title = 'This copy is the same on every visa page.' }: { title?: string }) {
    return (
        <span
            title={title}
            className="inline-flex items-center gap-1 rounded-full border border-royal/15 bg-white/60 px-2 py-0.5 text-[10px] font-normal normal-case tracking-normal text-ink/50"
        >
            <Lock size={10} strokeWidth={1.8} aria-hidden />
            Fixed
        </span>
    )
}

export function EditorHint({ preview, children }: { preview: boolean; children: ReactNode }) {
    return (
        <p className="mb-3 flex items-center gap-2 text-xs text-ink/55">
            <Info size={13} strokeWidth={1.6} aria-hidden />
            {preview
                ? 'Preview: this is how visitors will see the page after you save. Switch back to Edit to keep changing it.'
                : children}
        </p>
    )
}

export function EditorMessages({
    problems,
    saveError,
    notice,
}: {
    problems: string[]
    saveError: string | null
    notice: string | null
}) {
    if (problems.length === 0 && !saveError && !notice) return null
    return (
        <div className="mb-5 space-y-2">
            {saveError ? (
                <p className="rounded-[3px] border border-red-700/25 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {saveError}
                </p>
            ) : null}
            {problems.length > 0 ? (
                <div className="rounded-[3px] border border-red-700/25 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <p>Fix these before saving:</p>
                    <ul className="mt-1 list-disc pl-5 text-red-800/90">
                        {problems.map((message) => (
                            <li key={message}>{message}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
            {notice ? (
                <p className="rounded-[3px] border border-emerald-700/25 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {notice}
                </p>
            ) : null}
        </div>
    )
}

export function EditorLoadState({ error, onRetry }: { error?: Error | null; onRetry?: () => void }) {
    if (!error) {
        return (
            <div className="space-y-4">
                <div className="h-12 skeleton-paper rounded-[3px]" />
                <div className="h-[32rem] skeleton-paper rounded-2xl" />
            </div>
        )
    }
    return (
        <div className="rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
            <p className="text-sm text-red-800">{error.message}</p>
            <div className="mt-4 flex justify-center gap-5 text-sm font-medium">
                {onRetry ? (
                    <button type="button" onClick={onRetry} className="text-royal transition hover:text-gold-deep">
                        Try again
                    </button>
                ) : null}
                <Link to=".." relative="path" className="text-royal transition hover:text-gold-deep">
                    Back to visa pages
                </Link>
            </div>
        </div>
    )
}
