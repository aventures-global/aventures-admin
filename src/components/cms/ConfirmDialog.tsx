import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'

type ConfirmDialogProps = {
    open: boolean
    title: string
    body: string
    confirmLabel: string
    cancelLabel?: string
    tone?: 'danger' | 'default'
    busy?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmDialog({
    open,
    title,
    body,
    confirmLabel,
    cancelLabel = 'Cancel',
    tone = 'default',
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) onCancel()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, busy, onCancel])

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => !busy && onCancel()}
                >
                    <motion.div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        onClick={(event) => event.stopPropagation()}
                        className="card-surface w-full max-w-sm rounded-xl border border-white/10 p-5 shadow-2xl"
                    >
                        <h2 id="confirm-dialog-title" className="font-serif text-lg text-white">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-silver/70">{body}</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                autoFocus
                                disabled={busy}
                                onClick={onCancel}
                                className="rounded-lg border border-white/15 px-3.5 py-1.5 text-sm text-silver transition hover:border-gold/40 hover:text-gold disabled:opacity-60"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={onConfirm}
                                className={
                                    tone === 'danger'
                                        ? 'rounded-lg bg-red-500/90 px-3.5 py-1.5 text-sm text-white transition hover:bg-red-500 disabled:opacity-60'
                                        : 'btn-gold rounded-lg px-3.5 py-1.5 text-sm disabled:opacity-60'
                                }
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
