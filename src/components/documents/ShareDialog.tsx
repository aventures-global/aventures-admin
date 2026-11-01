import { Check, Copy, Link2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useCreateShare, useDocumentShares, useRevokeShare } from '../../hooks/useDocuments'
import { ghostActionClass, labelClass, primaryActionClass } from '../../lib/formStyles'
import type { ManagedDocument } from '../../services/documentService'
import SelectMenu from '../ui/SelectMenu'

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
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 font-poppins"
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
                        className="admin-panel w-full max-w-lg rounded-[3px] p-5 shadow-lg"
                    >
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[3px] bg-royal/8 text-royal">
                                <Link2 size={16} strokeWidth={1.75} />
                            </span>
                            <div className="min-w-0">
                                <h2 id="share-dialog-title" className="text-lg font-semibold text-ink">
                                    Share link
                                </h2>
                                <p className="mt-1 truncate text-sm text-ink/65">{file.displayName}</p>
                                <p className="mt-1 text-sm leading-relaxed text-ink/55">
                                    Anyone with the link can download until it expires or is revoked.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-end gap-3">
                            <div className="min-w-[10rem] flex-1">
                                <span className={labelClass}>Expires in</span>
                                <SelectMenu
                                    value={String(expiresInHours) as '24' | '168' | '720'}
                                    aria-label="Expires in"
                                    disabled={busy}
                                    onChange={(next) =>
                                        setExpiresInHours(Number(next) as 24 | 168 | 720)
                                    }
                                    options={EXPIRY_OPTIONS.map((option) => ({
                                        value: String(option.hours) as '24' | '168' | '720',
                                        label: option.label,
                                    }))}
                                />
                            </div>
                            <button
                                type="button"
                                disabled={busy}
                                className={primaryActionClass}
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
                            <div className="mt-4 flex items-center gap-2 rounded-[3px] border border-admin-border bg-admin-surface px-3 py-2">
                                <p className="min-w-0 flex-1 truncate text-sm text-ink/80">{createdUrl}</p>
                                <button
                                    type="button"
                                    className={ghostActionClass}
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
                                <ul className="mt-3 max-h-48 divide-y divide-admin-border overflow-y-auto">
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
                                                    className="rounded-[3px] border border-admin-border px-2.5 py-1 text-sm text-ink/75 transition hover:border-red-700 hover:text-red-800 disabled:opacity-60"
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
                            <button type="button" disabled={busy} onClick={onClose} className={ghostActionClass}>
                                Done
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
