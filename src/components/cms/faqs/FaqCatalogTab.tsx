import { ChevronDown, Pencil, Plus, Search, Star, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
    useAddTopFaq,
    useCreateFaq,
    useDeleteFaq,
    useRemoveTopFaq,
    useUpdateFaq,
} from '../../../hooks/useFaqs'
import { useNotice } from '../../../hooks/useNotice'
import type { Faq, FaqAdminData } from '../../../types/faq'
import ConfirmDialog from '../ConfirmDialog'
import FaqEditor from './FaqEditor'
import IconButton from './IconButton'
import Notice from './Notice'
import TopFaqQueue from './TopFaqQueue'

import { primaryActionClass, selectClass as controlClass } from '../../../lib/formStyles'

const UNCATEGORIZED = '__none'

type FaqCatalogTabProps = {
    data: FaqAdminData
}

type PendingConfirm =
    | { kind: 'delete'; faq: Faq }
    | { kind: 'enqueue'; faq: Faq; dropped: Faq }

export default function FaqCatalogTab({ data }: FaqCatalogTabProps) {
    const { categories, faqs, topIds, topLimit } = data
    const [query, setQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [confirm, setConfirm] = useState<PendingConfirm | null>(null)
    const [notice, setNotice] = useNotice()

    const createFaq = useCreateFaq()
    const updateFaq = useUpdateFaq()
    const deleteFaq = useDeleteFaq()
    const addTop = useAddTopFaq()
    const removeTop = useRemoveTopFaq()
    const queueBusy = addTop.isPending || removeTop.isPending

    const faqById = useMemo(() => new Map(faqs.map((faq) => [faq.id, faq])), [faqs])
    const categoryName = useMemo(
        () => new Map(categories.map((category) => [category.id, category.name])),
        [categories],
    )
    const queue = topIds.flatMap((id) => faqById.get(id) ?? [])
    const candidates = faqs.filter((faq) => !topIds.includes(faq.id))

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase()
        return faqs.filter((faq) => {
            if (categoryFilter === UNCATEGORIZED && faq.categoryIds.length > 0) return false
            if (
                categoryFilter !== 'all' &&
                categoryFilter !== UNCATEGORIZED &&
                !faq.categoryIds.includes(categoryFilter)
            ) {
                return false
            }
            if (!needle) return true
            return (
                faq.question.toLowerCase().includes(needle) || faq.answer.toLowerCase().includes(needle)
            )
        })
    }, [faqs, query, categoryFilter])

    const filtered = query.trim() !== '' || categoryFilter !== 'all'

    const enqueue = (faq: Faq) => {
        addTop.mutate(faq.id, {
            onSuccess: () => {
                setConfirm(null)
                setNotice({ tone: 'ok', text: 'Added to the contact form' })
            },
            onError: (err) => {
                setConfirm(null)
                setNotice({ tone: 'error', text: err.message })
            },
        })
    }

    const requestEnqueue = (faq: Faq) => {
        if (queue.length >= topLimit && queue[0]) {
            setConfirm({ kind: 'enqueue', faq, dropped: queue[0] })
            return
        }
        enqueue(faq)
    }

    const dequeue = (faq: Faq) => {
        removeTop.mutate(faq.id, {
            onSuccess: () => setNotice({ tone: 'ok', text: 'Removed from the contact form' }),
            onError: (err) => setNotice({ tone: 'error', text: err.message }),
        })
    }

    const confirmAction = () => {
        if (!confirm) return
        if (confirm.kind === 'enqueue') {
            enqueue(confirm.faq)
            return
        }
        const target = confirm.faq
        deleteFaq.mutate(target.id, {
            onSuccess: () => {
                setConfirm(null)
                if (editingId === target.id) setEditingId(null)
                setNotice({ tone: 'ok', text: 'FAQ deleted' })
            },
            onError: (err) => {
                setConfirm(null)
                setNotice({ tone: 'error', text: err.message })
            },
        })
    }

    return (
        <div className="space-y-6">
            <TopFaqQueue
                queue={queue}
                limit={topLimit}
                candidates={candidates}
                busy={queueBusy}
                onAdd={requestEnqueue}
                onRemove={dequeue}
            />

            <section aria-labelledby="faq-catalog-heading" className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 id="faq-catalog-heading" className="font-noto-serif text-xl text-ink">
                            Catalog
                        </h2>
                        <p className="mt-1 text-xs text-ink/60">
                            Listed A–Z. The FAQ page shows each FAQ under every category it belongs to.
                        </p>
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
                        New FAQ
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[14rem] flex-1">
                        <Search
                            size={15}
                            strokeWidth={1.6}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-deep"
                            aria-hidden
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Filter by question or answer…"
                            aria-label="Filter FAQs"
                            autoComplete="off"
                            className={`${controlClass} w-full pr-9 pl-9 placeholder:text-ink/40 [&::-webkit-search-cancel-button]:hidden`}
                        />
                        {query ? (
                            <button
                                type="button"
                                aria-label="Clear filter"
                                onClick={() => setQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/45 transition hover:bg-royal/5 hover:text-royal"
                            >
                                <X size={14} strokeWidth={1.6} />
                            </button>
                        ) : null}
                    </div>
                    <div className="relative">
                        <select
                            aria-label="Category"
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            className={`${controlClass} max-w-[16rem] cursor-pointer appearance-none pr-8 pl-3`}
                        >
                            <option value="all">All categories</option>
                            <option value={UNCATEGORIZED}>Uncategorized</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            strokeWidth={1.6}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-royal/70"
                            aria-hidden
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-ink/60" aria-live="polite">
                    <p>
                        {filtered ? `${visible.length} of ${faqs.length} FAQs` : `${faqs.length} FAQs`}
                    </p>
                    {filtered ? (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('')
                                setCategoryFilter('all')
                            }}
                            className="font-medium text-royal underline-offset-4 transition hover:text-gold-deep hover:underline"
                        >
                            Clear filters
                        </button>
                    ) : null}
                </div>

                <Notice notice={notice} />

                {creating ? (
                    <div className="paper-card rounded-[3px] border-royal/30 p-4 sm:p-5">
                        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-royal">New FAQ</p>
                        <FaqEditor
                            categories={categories}
                            submitLabel="Create FAQ"
                            busy={createFaq.isPending}
                            onCancel={() => setCreating(false)}
                            onSubmit={(input) =>
                                createFaq.mutate(input, {
                                    onSuccess: () => {
                                        setCreating(false)
                                        setNotice({ tone: 'ok', text: 'FAQ created' })
                                    },
                                    onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                })
                            }
                        />
                    </div>
                ) : null}

                {faqs.length === 0 && !creating ? (
                    <div className="rounded-[3px] border border-royal/15 px-6 py-14 text-center">
                        <p className="font-noto-serif text-2xl text-ink">No FAQs yet</p>
                        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
                            Create the first question to publish it on the FAQ page.
                        </p>
                    </div>
                ) : visible.length === 0 && !creating ? (
                    <div className="rounded-[3px] border border-royal/15 px-6 py-12 text-center text-sm text-ink/60">
                        No FAQs matched these filters.
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {visible.map((faq) => {
                            const slot = topIds.indexOf(faq.id)
                            if (editingId === faq.id) {
                                return (
                                    <li
                                        key={faq.id}
                                        className="paper-card rounded-[3px] border-royal/30 p-4 sm:p-5"
                                    >
                                        <FaqEditor
                                            initial={faq}
                                            categories={categories}
                                            submitLabel="Save changes"
                                            busy={updateFaq.isPending}
                                            onCancel={() => setEditingId(null)}
                                            onSubmit={(input) =>
                                                updateFaq.mutate(
                                                    { id: faq.id, input },
                                                    {
                                                        onSuccess: () => {
                                                            setEditingId(null)
                                                            setNotice({ tone: 'ok', text: 'FAQ saved' })
                                                        },
                                                        onError: (err) =>
                                                            setNotice({ tone: 'error', text: err.message }),
                                                    },
                                                )
                                            }
                                        />
                                    </li>
                                )
                            }
                            return (
                                <li
                                    key={faq.id}
                                    className="paper-card flex gap-3 rounded-[3px] px-4 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-noto-serif text-[15px] text-ink">{faq.question}</p>
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink/55">
                                            {faq.answer}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {slot >= 0 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gold-deep/15 px-2 py-0.5 text-[11px] text-[#9b7512]">
                                                    <Star size={11} strokeWidth={2} className="fill-gold-deep" aria-hidden />
                                                    Contact form · slot {slot + 1}
                                                </span>
                                            ) : null}
                                            {faq.categoryIds.length === 0 ? (
                                                <span className="rounded-full border border-dashed border-royal/25 px-2 py-0.5 text-[11px] text-ink/45">
                                                    Uncategorized
                                                </span>
                                            ) : (
                                                faq.categoryIds.map((id) => (
                                                    <span
                                                        key={id}
                                                        className="rounded-full border border-royal/20 px-2 py-0.5 text-[11px] text-royal"
                                                    >
                                                        {categoryName.get(id)}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-start gap-0.5">
                                        {slot >= 0 ? (
                                            <IconButton
                                                label="Remove from the contact form"
                                                disabled={queueBusy}
                                                onClick={() => dequeue(faq)}
                                            >
                                                <Star size={15} strokeWidth={1.75} className="fill-gold-deep text-gold-deep" />
                                            </IconButton>
                                        ) : (
                                            <IconButton
                                                label="Show beside the contact form"
                                                disabled={queueBusy}
                                                onClick={() => requestEnqueue(faq)}
                                            >
                                                <Star size={15} strokeWidth={1.75} />
                                            </IconButton>
                                        )}
                                        <IconButton
                                            label="Edit FAQ"
                                            onClick={() => {
                                                setEditingId(faq.id)
                                                setCreating(false)
                                            }}
                                        >
                                            <Pencil size={14} strokeWidth={1.75} />
                                        </IconButton>
                                        <IconButton
                                            label="Delete FAQ"
                                            tone="danger"
                                            onClick={() => setConfirm({ kind: 'delete', faq })}
                                        >
                                            <Trash2 size={14} strokeWidth={1.75} />
                                        </IconButton>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            <ConfirmDialog
                open={confirm !== null}
                title={confirm?.kind === 'enqueue' ? 'Replace the first FAQ?' : 'Delete FAQ?'}
                body={
                    confirm?.kind === 'enqueue'
                        ? `All ${topLimit} slots are full. Adding “${confirm.faq.question}” removes “${confirm.dropped.question}” from the contact form.`
                        : confirm
                          ? `“${confirm.faq.question}” will be removed from the FAQ page${
                                topIds.includes(confirm.faq.id) ? ' and the contact form' : ''
                            }.`
                          : ''
                }
                confirmLabel={confirm?.kind === 'enqueue' ? 'Add and replace' : 'Delete'}
                tone={confirm?.kind === 'enqueue' ? 'default' : 'danger'}
                busy={addTop.isPending || deleteFaq.isPending}
                onConfirm={confirmAction}
                onCancel={() => setConfirm(null)}
            />
        </div>
    )
}
