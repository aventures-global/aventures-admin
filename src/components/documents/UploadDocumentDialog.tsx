import { FileUp, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fieldClass, labelClass, selectClass } from '../../lib/formStyles'
import {
    CATEGORY_LABELS,
    formatBytes,
    type DocumentCategory,
    type FileSpace,
} from '../../services/documentService'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DocumentCategory[]

type UploadDocumentDialogProps = {
    open: boolean
    space: FileSpace
    busy?: boolean
    error?: string | null
    initialFiles?: File[]
    onClose: () => void
    onUpload: (input: {
        files: File[]
        category: DocumentCategory
        displayName?: string
        notes?: string
    }) => void
}

export default function UploadDocumentDialog({
    open,
    space,
    busy = false,
    error = null,
    initialFiles,
    onClose,
    onUpload,
}: UploadDocumentDialogProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<File[]>([])
    const [category, setCategory] = useState<DocumentCategory>('OTHER')
    const [displayName, setDisplayName] = useState('')
    const [notes, setNotes] = useState('')
    const [dragOver, setDragOver] = useState(false)

    useEffect(() => {
        if (!open) return
        setFiles(initialFiles?.length ? [...initialFiles] : [])
        setCategory(space === 'CUSTOMER' ? 'PASSPORT' : 'OTHER')
        setDisplayName('')
        setNotes('')
        setDragOver(false)
    }, [open, initialFiles, space])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, busy, onClose])

    const addFiles = (list: FileList | File[] | null) => {
        if (!list) return
        const next = Array.from(list)
        if (!next.length) return
        setFiles((prev) => {
            const names = new Set(prev.map((file) => `${file.name}:${file.size}`))
            return [...prev, ...next.filter((file) => !names.has(`${file.name}:${file.size}`))]
        })
    }

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (!files.length || busy) return
        onUpload({
            files,
            category,
            displayName: files.length === 1 ? displayName.trim() || undefined : undefined,
            notes: notes.trim() || undefined,
        })
    }

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
                        aria-labelledby="upload-document-title"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-lg rounded-[3px] border border-royal/15 bg-cream p-5 shadow-[0_24px_60px_rgba(22,55,101,0.2)]"
                    >
                        <h2 id="upload-document-title" className="font-noto-serif text-xl text-ink">
                            Upload files
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-ink/65">
                            {space === 'CUSTOMER'
                                ? 'Add travel documents for this customer. Images and PDFs up to 20 MB.'
                                : 'Add company files. Images, PDFs, and common office files up to 20 MB.'}
                        </p>

                        <form className="mt-5 space-y-4" onSubmit={submit}>
                            <div
                                className={`rounded-[3px] border border-dashed px-4 py-6 text-center transition ${
                                    dragOver ? 'border-royal bg-royal/5' : 'border-royal/25 bg-white/50'
                                }`}
                                onDragOver={(event) => {
                                    event.preventDefault()
                                    setDragOver(true)
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(event) => {
                                    event.preventDefault()
                                    setDragOver(false)
                                    addFiles(event.dataTransfer.files)
                                }}
                            >
                                <FileUp size={22} className="mx-auto text-royal/50" strokeWidth={1.5} />
                                <p className="mt-2 text-sm text-ink/70">Drag files here, or choose from your computer</p>
                                <button
                                    type="button"
                                    disabled={busy}
                                    className="mt-3 rounded-[3px] border border-royal/25 px-3 py-1.5 text-sm text-royal transition hover:border-royal disabled:opacity-60"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    Choose files
                                </button>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    className="hidden"
                                    multiple
                                    disabled={busy}
                                    onChange={(event) => {
                                        addFiles(event.target.files)
                                        event.target.value = ''
                                    }}
                                />
                            </div>

                            {files.length > 0 ? (
                                <ul className="max-h-40 divide-y divide-royal/10 overflow-y-auto rounded-[3px] border border-royal/10 bg-white/70">
                                    {files.map((file) => (
                                        <li key={`${file.name}:${file.size}`} className="flex items-center gap-2 px-3 py-2 text-sm">
                                            <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
                                            <span className="shrink-0 text-xs text-ink/45">{formatBytes(file.size)}</span>
                                            <button
                                                type="button"
                                                disabled={busy}
                                                className="rounded p-1 text-ink/40 transition hover:bg-royal/5 hover:text-royal disabled:opacity-60"
                                                aria-label={`Remove ${file.name}`}
                                                onClick={() =>
                                                    setFiles((prev) =>
                                                        prev.filter(
                                                            (item) =>
                                                                !(item.name === file.name && item.size === file.size),
                                                        ),
                                                    )
                                                }
                                            >
                                                <X size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}

                            {space === 'CUSTOMER' ? (
                                <label className="block">
                                    <span className={labelClass}>Category</span>
                                    <select
                                        className={`${selectClass} w-full`}
                                        value={category}
                                        disabled={busy}
                                        onChange={(event) => setCategory(event.target.value as DocumentCategory)}
                                    >
                                        {CATEGORIES.map((item) => (
                                            <option key={item} value={item}>
                                                {CATEGORY_LABELS[item]}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ) : null}

                            {files.length === 1 ? (
                                <label className="block">
                                    <span className={labelClass}>Display name (optional)</span>
                                    <input
                                        className={fieldClass}
                                        value={displayName}
                                        maxLength={240}
                                        placeholder={files[0]?.name}
                                        disabled={busy}
                                        onChange={(event) => setDisplayName(event.target.value)}
                                    />
                                    <span className="mt-1 block text-xs text-ink/45">
                                        The original file extension is kept automatically.
                                    </span>
                                </label>
                            ) : null}

                            <label className="block">
                                <span className={labelClass}>Notes (optional)</span>
                                <textarea
                                    className={`${fieldClass} min-h-[4.5rem] resize-y`}
                                    value={notes}
                                    maxLength={2000}
                                    disabled={busy}
                                    placeholder="Internal note for the team"
                                    onChange={(event) => setNotes(event.target.value)}
                                />
                            </label>

                            {error ? <p className="text-sm text-red-800">{error}</p> : null}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={onClose}
                                    className="rounded-[3px] border border-royal/25 px-3.5 py-1.5 text-sm text-ink/75 transition hover:border-royal hover:text-royal disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy || files.length === 0}
                                    className="btn-royal rounded-[3px] px-3.5 py-1.5 text-sm disabled:opacity-60"
                                >
                                    {busy
                                        ? 'Uploading…'
                                        : files.length > 1
                                          ? `Upload ${files.length} files`
                                          : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
