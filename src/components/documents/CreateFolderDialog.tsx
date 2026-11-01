import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type FormEvent } from 'react'
import { fieldClass, ghostActionClass, labelClass, primaryActionClass } from '../../lib/formStyles'

type CreateFolderDialogProps = {
    open: boolean
    busy?: boolean
    error?: string | null
    parentLabel?: string
    onClose: () => void
    onCreate: (name: string) => void
}

export default function CreateFolderDialog({
    open,
    busy = false,
    error = null,
    parentLabel,
    onClose,
    onCreate,
}: CreateFolderDialogProps) {
    const [name, setName] = useState('')

    useEffect(() => {
        if (open) setName('')
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, busy, onClose])

    const submit = (event: FormEvent) => {
        event.preventDefault()
        const trimmed = name.trim()
        if (!trimmed || busy) return
        onCreate(trimmed)
    }

    return (
        <AnimatePresence>
            {open ? (
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
                        aria-labelledby="create-folder-title"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        onClick={(event) => event.stopPropagation()}
                        className="admin-panel w-full max-w-md rounded-[3px] p-5 shadow-lg"
                    >
                        <h2 id="create-folder-title" className="text-lg font-semibold text-ink">
                            New folder
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-ink/65">
                            {parentLabel
                                ? `Create a folder inside “${parentLabel}”.`
                                : 'Create a folder in the current location.'}
                        </p>

                        <form className="mt-5 space-y-4" onSubmit={submit}>
                            <label className="block">
                                <span className={labelClass}>Folder name</span>
                                <input
                                    autoFocus
                                    className={fieldClass}
                                    value={name}
                                    maxLength={120}
                                    placeholder="e.g. Passport scans"
                                    disabled={busy}
                                    onChange={(event) => setName(event.target.value)}
                                />
                            </label>

                            {error ? <p className="text-sm text-red-800">{error}</p> : null}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={onClose}
                                    className={ghostActionClass}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy || !name.trim()}
                                    className={primaryActionClass}
                                >
                                    {busy ? 'Creating…' : 'Create folder'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
