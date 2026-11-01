import { Check, Copy, Link2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import {
    useCreateQuotationShare,
    useQuotationShares,
    useRevokeQuotationShare,
} from '../../hooks/useQuotations'
import { fieldClass, labelClass } from '../../lib/formStyles'
import type { Quotation } from '../../services/quotationService'

const EXPIRY_OPTIONS: { hours: 24 | 168 | 720; label: string }[] = [
    { hours: 24, label: '24 hours' },
    { hours: 168, label: '7 days' },
    { hours: 720, label: '30 days' },
]

export default function QuotationShareDialog({
    quotation,
    open,
    onClose,
}: {
    quotation: Quotation | null
    open: boolean
    onClose: () => void
}) {
    const { data: shares = [], isPending } = useQuotationShares(open && quotation ? quotation.id : null)
    const createShare = useCreateQuotationShare()
    const revokeShare = useRevokeQuotationShare()
    const [expiresInHours, setExpiresInHours] = useState<24 | 168 | 720>(168)
    const [createdUrl, setCreatedUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        setCreatedUrl(null)
        setCopied(false)
        setError(null)
        setExpiresInHours(168)
    }, [open, quotation?.id])

    useEffect(() => {
        if (!open) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !createShare.isPending && !revokeShare.isPending) onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, createShare.isPending, revokeShare.isPending, onClose])

    const copy = async (url: string) => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
    }

    const busy = createShare.isPending || revokeShare.isPending
    const activeShares = shares.filter((share) => !share.revokedAt)

    return (
        <AnimatePresence>
            {open && quotation ? (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-royal/30 p-4 font-poppins backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => !busy && onClose()}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="quote-share-title"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-lg rounded-[3px] border border-admin-border bg-admin-surface p-5 shadow-[0_24px_60px_rgba(22,55,101,0.2)]"
                    >
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[3px] bg-royal/8 text-royal">
                                <Link2 size={16} strokeWidth={1.75} />
                            </span>
                            <div>
                                <h2 id="quote-share-title" className="text-base font-medium text-royal">
                                    Share quotation
                                </h2>
                                <p className="mt-1 text-sm text-ink/55">
                                    {quotation.number} · {quotation.title}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <label className="block">
                                <span className={labelClass}>Expires in</span>
                                <select
                                    className={fieldClass}
                                    value={expiresInHours}
                                    onChange={(event) =>
                                        setExpiresInHours(Number(event.target.value) as 24 | 168 | 720)
                                    }
                                >
                                    {EXPIRY_OPTIONS.map((option) => (
                                        <option key={option.hours} value={option.hours}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <button
                                type="button"
                                disabled={busy}
                                className="btn-royal w-full rounded-[3px] px-4 py-2 text-sm disabled:opacity-60"
                                onClick={() => {
                                    setError(null)
                                    createShare.mutate(
                                        { id: quotation.id, expiresInHours },
                                        {
                                            onSuccess: (result) => setCreatedUrl(result.share.url ?? null),
                                            onError: (err) => setError(err.message),
                                        },
                                    )
                                }}
                            >
                                Create link
                            </button>

                            {createdUrl ? (
                                <div className="flex items-center gap-2 rounded-[3px] border border-admin-border bg-admin-bg px-3 py-2">
                                    <input readOnly value={createdUrl} className={`${fieldClass} border-0 px-0`} />
                                    <button
                                        type="button"
                                        className="shrink-0 text-royal"
                                        onClick={() => void copy(createdUrl)}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            ) : null}

                            {error ? <p className="text-sm text-red-600">{error}</p> : null}

                            <div className="border-t border-royal/10 pt-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
                                    Active links
                                </p>
                                {isPending ? (
                                    <div className="mt-2 h-12 skeleton-shimmer rounded-[3px]" />
                                ) : activeShares.length === 0 ? (
                                    <p className="mt-2 text-sm text-ink/50">No active share links.</p>
                                ) : (
                                    <ul className="mt-2 space-y-2">
                                        {activeShares.map((share) => (
                                            <li
                                                key={share.id}
                                                className="flex items-center justify-between gap-3 text-sm"
                                            >
                                                <span className="text-ink/65">
                                                    Expires {new Date(share.expiresAt).toLocaleString()} ·{' '}
                                                    {share.viewCount}
                                                    {share.maxViews != null ? `/${share.maxViews}` : ''} views
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    className="text-red-600 hover:underline disabled:opacity-50"
                                                    onClick={() =>
                                                        revokeShare.mutate({
                                                            shareId: share.id,
                                                            quotationId: quotation.id,
                                                        })
                                                    }
                                                >
                                                    Revoke
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                className="rounded-[3px] border border-royal/25 px-3 py-1.5 text-sm text-ink/70"
                                onClick={onClose}
                                disabled={busy}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
