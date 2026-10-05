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
import { Check, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
    useCreateMerchCategory,
    useDeleteMerchCategory,
    useRenameMerchCategory,
    useReorderMerchCategories,
} from '../../../hooks/useMerch'
import { useNotice } from '../../../hooks/useNotice'
import { fieldClass } from '../../../lib/formStyles'
import { moveItem } from '../../../lib/listOps'
import type { MerchCategory } from '../../../types/merch'
import ConfirmDialog from '../ConfirmDialog'
import IconButton from '../faqs/IconButton'
import Notice from '../faqs/Notice'

export default function ShopCategoriesTab({ categories }: { categories: MerchCategory[] }) {
    const [name, setName] = useState('')
    const [pendingDelete, setPendingDelete] = useState<MerchCategory | null>(null)
    const [notice, setNotice] = useNotice()
    const createCategory = useCreateMerchCategory()
    const deleteCategory = useDeleteMerchCategory()
    const reorder = useReorderMerchCategories()

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleCreate = (event: FormEvent) => {
        event.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) return
        createCategory.mutate(trimmed, {
            onSuccess: () => {
                setName('')
                setNotice({ tone: 'ok', text: `Added “${trimmed}”` })
            },
            onError: (err) => setNotice({ tone: 'error', text: err.message }),
        })
    }

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return
        const from = categories.findIndex((category) => category.id === active.id)
        const to = categories.findIndex((category) => category.id === over.id)
        if (from < 0 || to < 0) return
        const ids = moveItem(categories, from, to).map((category) => category.id)
        reorder.mutate(ids, {
            onSuccess: () => setNotice({ tone: 'ok', text: 'Order saved' }),
            onError: (err) => setNotice({ tone: 'error', text: err.message }),
        })
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        const target = pendingDelete
        if (target.productCount > 0) {
            setPendingDelete(null)
            return
        }
        deleteCategory.mutate(target.id, {
            onSuccess: () => {
                setPendingDelete(null)
                setNotice({ tone: 'ok', text: `Deleted “${target.name}”` })
            },
            onError: (err) => {
                setPendingDelete(null)
                setNotice({ tone: 'error', text: err.message })
            },
        })
    }

    const inUse = (pendingDelete?.productCount ?? 0) > 0

    return (
        <div className="max-w-3xl space-y-4">
            <form onSubmit={handleCreate} className="flex gap-2">
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="New category name"
                    aria-label="New category name"
                    maxLength={60}
                    className={fieldClass}
                />
                <button
                    type="submit"
                    disabled={!name.trim() || createCategory.isPending}
                    className="btn-royal inline-flex shrink-0 items-center gap-1.5 rounded-[3px] px-3.5 py-2 text-sm disabled:opacity-60"
                >
                    <Plus size={15} strokeWidth={1.75} aria-hidden />
                    Add category
                </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink/50">
                <p>
                    {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
                </p>
                {categories.length > 1 ? (
                    <p className="flex items-center gap-1.5">
                        <GripVertical size={13} strokeWidth={1.6} aria-hidden />
                        Drag to set the order of the filter tabs on the shop
                    </p>
                ) : null}
            </div>

            <Notice notice={notice} />

            {categories.length === 0 ? (
                <div className="rounded-[3px] border border-royal/15 px-6 py-14 text-center">
                    <p className="font-noto-serif text-2xl text-ink">No categories yet</p>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
                        Add a category above. Every product belongs to one category.
                    </p>
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext
                        items={categories.map((category) => category.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ol className="space-y-2">
                            {categories.map((category, index) => (
                                <CategoryRow
                                    key={category.id}
                                    category={category}
                                    position={index + 1}
                                    onDelete={() => setPendingDelete(category)}
                                    onNotice={setNotice}
                                />
                            ))}
                        </ol>
                    </SortableContext>
                </DndContext>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title={inUse ? 'Category is in use' : 'Delete category?'}
                body={
                    !pendingDelete
                        ? ''
                        : inUse
                          ? `“${pendingDelete.name}” is used by ${pendingDelete.productCount} product${
                                pendingDelete.productCount === 1 ? '' : 's'
                            }. Move ${pendingDelete.productCount === 1 ? 'it' : 'them'} to another category before deleting.`
                          : `“${pendingDelete.name}” has no products and will be removed.`
                }
                confirmLabel={inUse ? 'OK' : 'Delete'}
                tone={inUse ? 'default' : 'danger'}
                busy={deleteCategory.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    )
}

function CategoryRow({
    category,
    position,
    onDelete,
    onNotice,
}: {
    category: MerchCategory
    position: number
    onDelete: () => void
    onNotice: ReturnType<typeof useNotice>[1]
}) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(category.name)
    const rename = useRenameMerchCategory()
    const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } =
        useSortable({ id: category.id, disabled: editing })

    const cancel = () => {
        setEditing(false)
        setDraft(category.name)
    }

    const save = (event: FormEvent) => {
        event.preventDefault()
        const trimmed = draft.trim()
        if (!trimmed || trimmed === category.name) {
            cancel()
            return
        }
        rename.mutate(
            { id: category.id, name: trimmed },
            {
                onSuccess: () => {
                    setEditing(false)
                    onNotice({ tone: 'ok', text: 'Category renamed' })
                },
                onError: (err) => onNotice({ tone: 'error', text: err.message }),
            },
        )
    }

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`paper-card flex items-center gap-3 rounded-[3px] px-3 py-2.5 ${
                isDragging ? 'relative z-10 opacity-90 shadow-[0_18px_40px_rgba(22,55,101,0.18)]' : ''
            }`}
        >
            <button
                type="button"
                ref={setActivatorNodeRef}
                aria-label={`Reorder ${category.name}`}
                disabled={editing}
                className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-ink/35 transition hover:text-royal disabled:cursor-default disabled:opacity-40"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={16} strokeWidth={1.6} />
            </button>
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-ink/40">{position}</span>

            {editing ? (
                <form onSubmit={save} className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                        autoFocus
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') cancel()
                        }}
                        aria-label="Category name"
                        maxLength={60}
                        className={`${fieldClass} py-1.5`}
                    />
                    <IconButton label="Save name" type="submit" disabled={rename.isPending}>
                        <Check size={15} strokeWidth={1.75} />
                    </IconButton>
                    <IconButton label="Cancel rename" onClick={cancel}>
                        <X size={15} strokeWidth={1.75} />
                    </IconButton>
                </form>
            ) : (
                <>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{category.name}</p>
                        <p className="text-xs text-ink/50">
                            {category.productCount === 0
                                ? 'No products — hidden on the shop'
                                : `${category.productCount} product${category.productCount === 1 ? '' : 's'}`}
                        </p>
                    </div>
                    <IconButton
                        label={`Rename ${category.name}`}
                        onClick={() => {
                            setDraft(category.name)
                            setEditing(true)
                        }}
                    >
                        <Pencil size={14} strokeWidth={1.75} />
                    </IconButton>
                    <IconButton label={`Delete ${category.name}`} tone="danger" onClick={onDelete}>
                        <Trash2 size={14} strokeWidth={1.75} />
                    </IconButton>
                </>
            )}
        </li>
    )
}
