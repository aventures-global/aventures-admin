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
import { GripVertical, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import IconButton from '../../components/cms/faqs/IconButton'
import Notice from '../../components/cms/faqs/Notice'
import TestimonialEditor from '../../components/cms/testimonials/TestimonialEditor'
import { useNotice } from '../../hooks/useNotice'
import {
    useCreateTestimonial,
    useDeleteTestimonial,
    useReorderTestimonials,
    useTestimonials,
    useUpdateTestimonial,
} from '../../hooks/useTestimonials'
import { primaryActionClass } from '../../lib/formStyles'
import { moveItem } from '../../lib/listOps'
import type { Testimonial } from '../../services/testimonialService'

export default function Testimonials() {
    const { data: testimonials = [], isPending, isError, error, refetch } = useTestimonials()
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [pendingDelete, setPendingDelete] = useState<Testimonial | null>(null)
    const [notice, setNotice] = useNotice()

    const createTestimonial = useCreateTestimonial()
    const updateTestimonial = useUpdateTestimonial()
    const deleteTestimonial = useDeleteTestimonial()
    const reorder = useReorderTestimonials()

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return
        const from = testimonials.findIndex((item) => item.id === active.id)
        const to = testimonials.findIndex((item) => item.id === over.id)
        if (from < 0 || to < 0) return
        const ids = moveItem(testimonials, from, to).map((item) => item.id)
        reorder.mutate(ids, {
            onSuccess: () => setNotice({ tone: 'ok', text: 'Order saved' }),
            onError: (err) => setNotice({ tone: 'error', text: err.message }),
        })
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        const target = pendingDelete
        deleteTestimonial.mutate(target.id, {
            onSuccess: () => {
                setPendingDelete(null)
                if (editingId === target.id) setEditingId(null)
                setNotice({ tone: 'ok', text: 'Testimonial deleted' })
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
                title="Testimonials"
                description="Client quotes shown on the homepage and in the Client Experiences section of every destination page. The first five appear in the destination carousel."
            />

            <div className="mt-6 max-w-3xl space-y-4">
                {isPending ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-24 skeleton-paper rounded-[3px]" />
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
                                    {testimonials.length} testimonial{testimonials.length === 1 ? '' : 's'}
                                </p>
                                {testimonials.length > 1 ? (
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
                                New testimonial
                            </button>
                        </div>

                        <Notice notice={notice} />

                        {creating ? (
                            <div className="paper-card rounded-[3px] border-royal/30 p-4 sm:p-5">
                                <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-royal">
                                    New testimonial
                                </p>
                                <TestimonialEditor
                                    submitLabel="Add testimonial"
                                    busy={createTestimonial.isPending}
                                    onCancel={() => setCreating(false)}
                                    onSubmit={(input) =>
                                        createTestimonial.mutate(input, {
                                            onSuccess: () => {
                                                setCreating(false)
                                                setNotice({ tone: 'ok', text: 'Testimonial added' })
                                            },
                                            onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                        })
                                    }
                                />
                            </div>
                        ) : null}

                        {testimonials.length === 0 && !creating ? (
                            <div className="rounded-[3px] border border-royal/15 px-6 py-14 text-center">
                                <p className="font-noto-serif text-2xl text-ink">No testimonials yet</p>
                                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
                                    The homepage hides this section until you add one. Destination pages show a
                                    generic quote instead.
                                </p>
                            </div>
                        ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                <SortableContext
                                    items={testimonials.map((item) => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <ol className="space-y-2">
                                        {testimonials.map((item, index) =>
                                            editingId === item.id ? (
                                                <li
                                                    key={item.id}
                                                    className="paper-card rounded-[3px] border-royal/30 p-4 sm:p-5"
                                                >
                                                    <TestimonialEditor
                                                        initial={item}
                                                        submitLabel="Save changes"
                                                        busy={updateTestimonial.isPending}
                                                        onCancel={() => setEditingId(null)}
                                                        onSubmit={(input) =>
                                                            updateTestimonial.mutate(
                                                                { id: item.id, input },
                                                                {
                                                                    onSuccess: () => {
                                                                        setEditingId(null)
                                                                        setNotice({ tone: 'ok', text: 'Testimonial saved' })
                                                                    },
                                                                    onError: (err) =>
                                                                        setNotice({ tone: 'error', text: err.message }),
                                                                },
                                                            )
                                                        }
                                                    />
                                                </li>
                                            ) : (
                                                <TestimonialRow
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
                title="Delete testimonial?"
                body={pendingDelete ? `${pendingDelete.name}’s quote will be removed from the site.` : ''}
                confirmLabel="Delete"
                tone="danger"
                busy={deleteTestimonial.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    )
}

function TestimonialRow({
    item,
    position,
    onEdit,
    onDelete,
}: {
    item: Testimonial
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
            className={`paper-card flex items-start gap-3 rounded-[3px] px-3 py-3 ${
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
            <span className="mt-2 w-5 shrink-0 text-right text-xs tabular-nums text-ink/40">{position}</span>
            <div className="min-w-0 flex-1">
                <div className="flex gap-0.5" role="img" aria-label={`${item.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                            key={value}
                            size={13}
                            strokeWidth={1.5}
                            className={value <= item.rating ? 'fill-gold-deep text-gold-deep' : 'text-royal/20'}
                            aria-hidden
                        />
                    ))}
                </div>
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink/75">“{item.quote}”</p>
                <p className="mt-1.5 text-xs text-ink/50">
                    <span className="font-medium text-ink/75">{item.name}</span> · {item.trip}
                </p>
            </div>
            <div className="flex shrink-0 items-start gap-0.5">
                <IconButton label={`Edit ${item.name}’s testimonial`} onClick={onEdit}>
                    <Pencil size={14} strokeWidth={1.75} />
                </IconButton>
                <IconButton label={`Delete ${item.name}’s testimonial`} tone="danger" onClick={onDelete}>
                    <Trash2 size={14} strokeWidth={1.75} />
                </IconButton>
            </div>
        </li>
    )
}
