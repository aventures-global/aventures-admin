import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

type EditorToolbarProps = {
    backTo: string
    backLabel: string
    dirty: boolean
    saving: boolean
    isNew: boolean
    onSave: () => void
    onDiscard: () => void
    onDelete?: () => void
}

export default function EditorToolbar({
    backTo,
    backLabel,
    dirty,
    saving,
    isNew,
    onSave,
    onDiscard,
    onDelete,
}: EditorToolbarProps) {
    const status = saving
        ? 'Saving…'
        : isNew
          ? 'Not published yet'
          : dirty
            ? 'Unsaved changes'
            : 'All changes saved'

    return (
        <div className="sticky top-14 z-30 -mx-4 -mt-6 mb-5 border-b border-white/10 bg-ink/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:-mt-8 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                    to={backTo}
                    relative="path"
                    className="inline-flex items-center gap-1.5 text-sm text-silver/70 transition hover:text-gold"
                >
                    <ArrowLeft size={15} strokeWidth={1.5} aria-hidden />
                    {backLabel}
                </Link>

                <span className="flex items-center gap-2 text-xs text-silver/60">
                    <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${
                            dirty || isNew ? 'bg-gold' : 'bg-emerald-400/80'
                        }`}
                    />
                    {status}
                </span>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {onDelete ? (
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-300/80 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                        >
                            <Trash2 size={13} strokeWidth={1.6} aria-hidden />
                            Delete
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={onDiscard}
                        disabled={!dirty || saving}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-silver transition hover:border-gold/40 hover:text-gold disabled:pointer-events-none disabled:opacity-40"
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={(!dirty && !isNew) || saving}
                        className="btn-gold inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs disabled:pointer-events-none disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" aria-hidden /> : null}
                        {isNew ? 'Create destination' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
