import { Check, Copy, Link2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useCreateShare, useDocumentShares, useRevokeShare } from '../../hooks/useDocuments'
import { fieldClass, labelClass } from '../../lib/formStyles'
import type { ManagedDocument } from '../../services/documentService'

const EXPIRY_OPTIONS: { hours: 24 | 168 | 720; label: string }[] = [
    { hours: 24, label: '24 hours' },
    { hours: 168, label: '7 days' },
    { hours: 720, label: '30 days' },
]

export default function ShareDialog({
    file,
    open,
    onClose,
}: {
    file: ManagedDocument | null
    open: boolean
    onClose: () => void
}) {
    const { data: shares = [], isPending } = useDocumentShares(open && file ? file.id : null)
    const createShare = useCreateShare()
    const revokeShare = useRevokeShare()
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
    }, [open, file?.id])

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

    return (
        <AnimatePresence>
            {open && file ? (
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
                        aria-labelledby="share-dialog-title"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-lg rounded-[3px] border border-royal/15 bg-cream p-5 shadow-[0_24px_60px_rgba(22,55,101,0.2)]"
                    >
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[3px] bg-royal/8 text-royal">
                                <Link2 size={16} strokeWidth={1.75} />
                            </span>
                            <div className="min-w-0">
                                <h2 id="share-dialog-title" className="font-noto-serif text-xl text-ink">
                                    Share link
                                </h2>
                                <p className="mt-1 truncate text-sm text-ink/65">{file.displayName}</p>
                                <p className="mt-1 text-sm leading-relaxed text-ink/55">
                                    Anyone with the link can download until it expires or is revoked.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-end gap-3">
                            <label className="min-w-[10rem] flex-1">
                                <span className={labelClass}>Expires in</span>
                                <select
                                    className={fieldClass}
                                    value={expiresInHours}
                                    disabled={busy}
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
                                className="btn-royal inline-flex items-center gap-1.5 rounded-[3px] px-3.5 py-2 text-sm disabled:opacity-60"
                                onClick={() => {
                                    setError(null)
                                    createShare.mutate(
                                        { fileId: file.id, expiresInHours },
                                        {
                                            onSuccess: (share) => {
                                                setCreatedUrl(share.url ?? null)
                                                if (share.url) void copy(share.url)
                                            },
                                            onError: (err) => setError(err.message),
                                        },
                                    )
                                }}
                            >
                                <Link2 size={15} strokeWidth={1.75} />
                                {createShare.isPending ? 'Creating…' : 'Create link'}
                            </button>
                        </div>

                        {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}

                        {createdUrl ? (
                            <div className="mt-4 flex items-center gap-2 rounded-[3px] border border-royal/15 bg-white/70 px-3 py-2">
                                <p className="min-w-0 flex-1 truncate text-sm text-ink/80">{createdUrl}</p>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-[3px] border border-royal/25 px-2.5 py-1 text-sm text-ink/75 transition hover:border-royal hover:text-royal"
                                    onClick={() => void copy(createdUrl)}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        ) : null}

                        <div className="mt-6">
                            <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-ink/55">
                                Existing links
                            </h3>
                            {isPending ? (
                                <div className="mt-3 h-16 skeleton-shimmer rounded-[3px]" />
                            ) : shares.length === 0 ? (
                                <p className="mt-3 text-sm text-ink/50">No share links yet.</p>
                            ) : (
                                <ul className="mt-3 max-h-48 divide-y divide-royal/10 overflow-y-auto">
                                    {shares.map((share) => (
                                        <li
                                            key={share.id}
                                            className="flex items-center justify-between gap-3 py-2.5 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-ink/80">
                                                    {share.status} · expires{' '}
                                                    {new Date(share.expiresAt).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-ink/45">
                                                    {share.downloadCount}
                                                    {share.maxDownloads != null ? ` / ${share.maxDownloads}` : ''}{' '}
                                                    downloads
                                                    {share.createdBy?.name ? ` · ${share.createdBy.name}` : ''}
                                                </p>
                                            </div>
                                            {share.status === 'ACTIVE' ? (
                                                <button
                                                    type="button"
                                                    className="rounded-[3px] border border-royal/25 px-2.5 py-1 text-sm text-ink/75 transition hover:border-red-700 hover:text-red-800 disabled:opacity-60"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        revokeShare.mutate({
                                                            shareId: share.id,
                                                            fileId: file.id,
                                                        })
                                                    }
                                                >
                                                    Revoke
                                                </button>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={onClose}
                                className="rounded-[3px] border border-royal/25 px-3.5 py-1.5 text-sm text-ink/75 transition hover:border-royal hover:text-royal disabled:opacity-60"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
