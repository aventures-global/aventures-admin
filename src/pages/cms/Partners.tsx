import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import IconButton from '../../components/cms/faqs/IconButton'
import Notice from '../../components/cms/faqs/Notice'
import PartnerEditor from '../../components/cms/partners/PartnerEditor'
import SafeImage from '../../components/ui/SafeImage'
import { useNotice } from '../../hooks/useNotice'
import {
    useCreatePartner,
    useDeletePartner,
    usePartners,
    useReorderPartners,
    useUpdatePartner,
} from '../../hooks/usePartners'
import { primaryActionClass } from '../../lib/formStyles'
import { moveItem } from '../../lib/listOps'
import type { Partner } from '../../services/partnerService'

export default function Partners() {
    const { data: partners = [], isPending, isError, error, refetch } = usePartners()
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [pendingDelete, setPendingDelete] = useState<Partner | null>(null)
    const [notice, setNotice] = useNotice()

    const createPartner = useCreatePartner()
    const updatePartner = useUpdatePartner()
    const deletePartner = useDeletePartner()
    const reorder = useReorderPartners()

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return
        const from = partners.findIndex((item) => item.id === active.id)
        const to = partners.findIndex((item) => item.id === over.id)
        if (from < 0 || to < 0) return
        const ids = moveItem(partners, from, to).map((item) => item.id)
        reorder.mutate(ids, {
            onSuccess: () => setNotice({ tone: 'ok', text: 'Order saved' }),
            onError: (err) => setNotice({ tone: 'error', text: err.message }),
        })
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        const target = pendingDelete
        deletePartner.mutate(target.id, {
            onSuccess: () => {
                setPendingDelete(null)
                if (editingId === target.id) setEditingId(null)
                setNotice({ tone: 'ok', text: 'Partner deleted' })
            },
            onError: (err) => {
                setPendingDelete(null)
                setNotice({ tone: 'error', text: err.message })
            },
        })
    }

    return (
        <div>
            <PageHeader
                eyebrow="CMS"
                title="Partners"
                description="Partner businesses shown in the Trusted Partners section of the homepage."
            />

            <div className="mt-6 max-w-3xl space-y-4">
                {isPending ? (
                    <div className="space-y-3">
                        {[0, 1].map((i) => (
                            <div key={i} className="h-20 skeleton-paper rounded-[3px]" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
                        <p className="text-sm text-red-800">{error.message}</p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="mt-4 text-sm font-medium text-royal transition hover:text-gold-deep"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-ink/50">
                                <p>
                                    {partners.length} partner{partners.length === 1 ? '' : 's'}
                                </p>
                                {partners.length > 1 ? (
                                    <p className="mt-1 flex items-center gap-1.5">
                                        <GripVertical size={13} strokeWidth={1.6} aria-hidden />
                                        Drag to set the order on the site
                                    </p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setCreating(true)
                                    setEditingId(null)
                                }}
                                disabled={creating}
                                className={primaryActionClass}
                            >
                                <Plus size={15} strokeWidth={1.75} aria-hidden />
                                New partner
                            </button>
                        </div>

                        <Notice notice={notice} />

                        {creating ? (
                            <div className="paper-card rounded-[3px] border-royal/30 p-4 sm:p-5">
                                <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-royal">
                                    New partner
                                </p>
                                <PartnerEditor
                                    submitLabel="Add partner"
                                    busy={createPartner.isPending}
                                    onCancel={() => setCreating(false)}
                                    onSubmit={(input) =>
                                        createPartner.mutate(input, {
                                            onSuccess: () => {
                                                setCreating(false)
                                                setNotice({ tone: 'ok', text: 'Partner added' })
                                            },
                                            onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                        })
                                    }
                                />
                            </div>
                        ) : null}

                        {partners.length === 0 && !creating ? (
                            <div className="rounded-[3px] border border-royal/15 px-6 py-14 text-center">
                                <p className="font-noto-serif text-2xl text-ink">No partners yet</p>
                                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
                                    The homepage hides the Trusted Partners section until you add one.
                                </p>
                            </div>
                        ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                <SortableContext
                                    items={partners.map((item) => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <ol className="space-y-2">
                                        {partners.map((item, index) =>
                                            editingId === item.id ? (
                                                <li
                                                    key={item.id}
                                                    className="paper-card rounded-[3px] border-royal/30 p-4 sm:p-5"
                                                >
                                                    <PartnerEditor
                                                        initial={item}
                                                        submitLabel="Save changes"
                                                        busy={updatePartner.isPending}
                                                        onCancel={() => setEditingId(null)}
                                                        onSubmit={(input) =>
                                                            updatePartner.mutate(
                                                                { id: item.id, input },
                                                                {
                                                                    onSuccess: () => {
                                                                        setEditingId(null)
                                                                        setNotice({ tone: 'ok', text: 'Partner saved' })
                                                                    },
                                                                    onError: (err) =>
                                                                        setNotice({ tone: 'error', text: err.message }),
                                                                },
                                                            )
                                                        }
                                                    />
                                                </li>
                                            ) : (
                                                <PartnerRow
                                                    key={item.id}
                                                    item={item}
                                                    position={index + 1}
                                                    onEdit={() => {
                                                        setEditingId(item.id)
                                                        setCreating(false)
                                                    }}
                                                    onDelete={() => setPendingDelete(item)}
                                                />
                                            ),
                                        )}
                                    </ol>
                                </SortableContext>
                            </DndContext>
                        )}
                    </>
                )}
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete partner?"
                body={pendingDelete ? `${pendingDelete.name} will be removed from the homepage.` : ''}
                confirmLabel="Delete"
                tone="danger"
                busy={deletePartner.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    )
}

function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('')
}

function PartnerRow({
    item,
    position,
    onEdit,
    onDelete,
}: {
    item: Partner
    position: number
    onEdit: () => void
    onDelete: () => void
}) {
    const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } =
        useSortable({ id: item.id })

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`paper-card flex items-center gap-3 rounded-[3px] px-3 py-3 ${
                isDragging ? 'relative z-10 opacity-90 shadow-[0_18px_40px_rgba(22,55,101,0.18)]' : ''
            }`}
        >
            <button
                type="button"
                ref={setActivatorNodeRef}
                aria-label={`Reorder ${item.name}`}
                className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-ink/35 transition hover:text-royal"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={16} strokeWidth={1.6} />
            </button>
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-ink/40">{position}</span>
            {item.logoSrc ? (
                <SafeImage
                    src={item.logoSrc}
                    alt={`${item.name} logo`}
                    className="h-12 w-20 shrink-0 rounded-[3px] border border-royal/10 bg-white"
                    imgClassName="object-contain p-1.5"
                />
            ) : (
                <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-royal font-noto-serif text-sm text-cream"
                    title="No logo yet"
                    aria-hidden
                >
                    {initials(item.name)}
                </span>
            )}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink/85">{item.name}</p>
                <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-xs text-royal/70 transition hover:text-gold-deep"
                >
                    {item.url}
                </a>
                {!item.logoSrc ? <p className="mt-0.5 text-[11px] text-ink/45">No logo yet</p> : null}
            </div>
            <div className="flex shrink-0 items-start gap-0.5">
                <IconButton label={`Edit ${item.name}`} onClick={onEdit}>
                    <Pencil size={14} strokeWidth={1.75} />
                </IconButton>
                <IconButton label={`Delete ${item.name}`} tone="danger" onClick={onDelete}>
                    <Trash2 size={14} strokeWidth={1.75} />
                </IconButton>
            </div>
        </li>
    )
}
