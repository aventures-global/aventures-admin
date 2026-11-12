import { FileUp, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ghostActionClass, primaryActionClass } from '../../lib/formStyles'

function isJsonFile(file: File) {
    const name = file.name.toLowerCase()
    return name.endsWith('.json') || file.type === 'application/json' || file.type === 'text/json'
}

export default function ImportInquiryDialog({
    open,
    busy = false,
    error = null,
    onClose,
    onImport,
}: {
    open: boolean
    busy?: boolean
    error?: string | null
    onClose: () => void
    onImport: (file: File) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        setFile(null)
        setDragOver(false)
        setLocalError(null)
        if (inputRef.current) inputRef.current.value = ''
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, busy, onClose])

    const pickFile = (next: File | null | undefined) => {
        if (!next) return
        if (!isJsonFile(next)) {
            setFile(null)
            setLocalError('Choose an aventure-inquiry.json file')
            return
        }
        setLocalError(null)
        setFile(next)
    }

    const shownError = localError || error

    return (
        <AnimatePresence>
            {open ? (
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
                        aria-labelledby="import-inquiry-title"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        onClick={(event) => event.stopPropagation()}
                        className="admin-panel w-full max-w-lg rounded-[3px] p-5 shadow-lg"
                    >
                        <h2 id="import-inquiry-title" className="text-lg font-semibold text-ink">
                            Import inquiry
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-ink/65">
                            Drop the <span className="font-medium text-ink/80">aventure-inquiry.json</span>{' '}
                            attachment from an inquiry email, or choose it from your computer. This prefills
                            the customer, title, and staff notes.
                        </p>

                        <div
                            className={`mt-5 rounded-[3px] border border-dashed px-4 py-8 text-center transition ${
                                dragOver
                                    ? 'border-royal bg-royal/5'
                                    : 'border-admin-border bg-admin-surface'
                            }`}
                            onDragOver={(event) => {
                                event.preventDefault()
                                setDragOver(true)
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(event) => {
                                event.preventDefault()
                                setDragOver(false)
                                pickFile(event.dataTransfer.files?.[0])
                            }}
                        >
                            <FileUp size={22} className="mx-auto text-royal/50" strokeWidth={1.5} />
                            <p className="mt-2 text-sm text-ink/70">
                                Drag the inquiry JSON here, or choose from your computer
                            </p>
                            <button
                                type="button"
                                disabled={busy}
                                className={`${ghostActionClass} mt-3`}
                                onClick={() => inputRef.current?.click()}
                            >
                                Choose file
                            </button>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="application/json,.json"
                                className="hidden"
                                disabled={busy}
                                onChange={(event) => {
                                    pickFile(event.target.files?.[0])
                                    event.target.value = ''
                                }}
                            />
                        </div>

                        {file ? (
                            <div className="mt-4 flex items-center gap-2 rounded-[3px] border border-admin-border bg-admin-surface px-3 py-2 text-sm">
                                <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
                                <button
                                    type="button"
                                    disabled={busy}
                                    className="rounded p-1 text-ink/40 transition hover:bg-royal/5 hover:text-royal disabled:opacity-60"
                                    aria-label={`Remove ${file.name}`}
                                    onClick={() => {
                                        setFile(null)
                                        setLocalError(null)
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : null}

                        {shownError ? <p className="mt-3 text-sm text-red-800">{shownError}</p> : null}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={onClose}
                                className={ghostActionClass}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={busy || !file}
                                className={primaryActionClass}
                                onClick={() => {
                                    if (!file || busy) return
                                    onImport(file)
                                }}
                            >
                                {busy ? 'Importing…' : 'Import'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
