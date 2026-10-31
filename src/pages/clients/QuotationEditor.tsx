import { ArrowLeft, Download, FileText, Link2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Notice from '../../components/cms/faqs/Notice'
import QuotationShareDialog from '../../components/quotations/QuotationShareDialog'
import PageHeader from '../../components/PageHeader'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { useNotice } from '../../hooks/useNotice'
import {
    useChangeQuotationStatus,
    useConvertQuotation,
    useCreateQuotation,
    useDeleteQuotation,
    useGenerateQuotationPdf,
    useQuotation,
    useUpdateQuotation,
} from '../../hooks/useQuotations'
import { useAuth } from '../../lib/authContext'
import {
    fieldClass,
    ghostActionClass,
    labelClass,
    primaryActionClass,
    selectClass,
} from '../../lib/formStyles'
import {
    KIND_LABELS,
    STATUS_LABELS,
    centsFromMajor,
    downloadQuotationPdf,
    majorFromCents,
    type Quotation,
    type QuotationItemKind,
    type QuotationItemInput,
} from '../../services/quotationService'

type DraftItem = {
    key: string
    kind: QuotationItemKind
    title: string
    description: string
    quantity: number
    unitMajor: string
    isOptional: boolean
    selected: boolean
}

function emptyItem(kind: QuotationItemKind = 'SERVICE'): DraftItem {
    return {
        key: crypto.randomUUID(),
        kind,
        title: '',
        description: '',
        quantity: 1,
        unitMajor: '0.00',
        isOptional: kind === 'OPTIONAL',
        selected: kind !== 'OPTIONAL',
    }
}

function itemsFromQuote(quote: Quotation): DraftItem[] {
    return quote.items.map((item) => ({
        key: item.id ?? crypto.randomUUID(),
        kind: item.kind,
        title: item.title,
        description: item.description ?? '',
        quantity: item.quantity,
        unitMajor: majorFromCents(item.unitCents),
        isOptional: item.isOptional,
        selected: item.selected,
    }))
}

function toItemInputs(items: DraftItem[]): QuotationItemInput[] {
    return items.map((item, index) => ({
        kind: item.kind,
        title: item.title.trim(),
        description: item.description.trim() || null,
        quantity: item.quantity,
        unitCents: centsFromMajor(item.unitMajor),
        isOptional: item.isOptional || item.kind === 'OPTIONAL',
        selected: item.selected,
        sortOrder: index,
    }))
}

function liveTotals(items: DraftItem[], currency: string) {
    const normalized = toItemInputs(items)
    const included = normalized.filter((item) => item.selected !== false)
    const subtotal = included
        .filter((item) => !(item.isOptional || item.kind === 'OPTIONAL'))
        .reduce((sum, item) => sum + item.quantity * item.unitCents, 0)
    const optional = included
        .filter((item) => item.isOptional || item.kind === 'OPTIONAL')
        .reduce((sum, item) => sum + item.quantity * item.unitCents, 0)
    const format = (cents: number) =>
        currency === 'USD' ? `$${Math.round(cents / 100)}` : `${(cents / 100).toFixed(2)} ${currency}`
    return { subtotal, optional, total: subtotal + optional, format }
}

export default function QuotationEditor() {
    const { id } = useParams()
    const isNew = !id || id === 'new'
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { can } = useAuth()
    const canView = can('quotations.view')
    const canManage = can('quotations.manage')
    const canShare = can('quotations.share')

    const { data, isPending, isError, error } = useQuotation(isNew ? undefined : id, canView && !isNew)
    const quote = data?.quotation

    const [customerUserId, setCustomerUserId] = useState(searchParams.get('customer') ?? '')
    const [title, setTitle] = useState('')
    const [currency, setCurrency] = useState('PHP')
    const [notes, setNotes] = useState('')
    const [customerMessage, setCustomerMessage] = useState('')
    const [validUntil, setValidUntil] = useState('')
    const [items, setItems] = useState<DraftItem[]>([emptyItem()])
    const [shareOpen, setShareOpen] = useState(false)
    const [notice, setNotice] = useNotice()
    const [customerQ, setCustomerQ] = useState('')

    const { data: customersData } = useAdminUsers(
        {
            scope: 'customers',
            q: customerQ,
            role: 'all',
            sort: 'createdAt',
            dir: 'desc',
            limit: 20,
            page: 1,
        },
        { enabled: canManage && isNew },
    )

    const create = useCreateQuotation()
    const update = useUpdateQuotation()
    const changeStatus = useChangeQuotationStatus()
    const generatePdf = useGenerateQuotationPdf()
    const convert = useConvertQuotation()
    const remove = useDeleteQuotation()

    useEffect(() => {
        if (!quote) return
        setCustomerUserId(quote.customer?.id ?? '')
        setTitle(quote.title)
        setCurrency(quote.currency)
        setNotes(quote.notes ?? '')
        setCustomerMessage(quote.customerMessage ?? '')
        setValidUntil(quote.validUntil ? quote.validUntil.slice(0, 10) : '')
        setItems(itemsFromQuote(quote))
    }, [quote])

    const totals = useMemo(() => liveTotals(items, currency), [items, currency])
    const editable = isNew || quote?.status === 'DRAFT' || quote?.status === 'SENT'
    const busy =
        create.isPending ||
        update.isPending ||
        changeStatus.isPending ||
        generatePdf.isPending ||
        convert.isPending ||
        remove.isPending

    const save = () => {
        const payloadItems = toItemInputs(items)
        if (!title.trim()) {
            setNotice({ tone: 'error', text: 'Title is required' })
            return
        }
        if (!payloadItems.length || payloadItems.some((item) => !item.title)) {
            setNotice({ tone: 'error', text: 'Add at least one line item with a title' })
            return
        }

        if (isNew) {
            if (!customerUserId) {
                setNotice({ tone: 'error', text: 'Select a customer' })
                return
            }
            create.mutate(
                {
                    customerUserId,
                    title: title.trim(),
                    currency,
                    notes: notes.trim() || null,
                    customerMessage: customerMessage.trim() || null,
                    validUntil: validUntil ? new Date(`${validUntil}T23:59:59.000Z`).toISOString() : null,
                    items: payloadItems,
                },
                {
                    onSuccess: (result) => {
                        setNotice({ tone: 'ok', text: 'Quotation created' })
                        navigate(`/clients/quotations/${result.quotation.id}`, { replace: true })
                    },
                    onError: (err) => setNotice({ tone: 'error', text: err.message }),
                },
            )
            return
        }

        update.mutate(
            {
                id: id!,
                input: {
                    title: title.trim(),
                    currency,
                    notes: notes.trim() || null,
                    customerMessage: customerMessage.trim() || null,
                    validUntil: validUntil ? new Date(`${validUntil}T23:59:59.000Z`).toISOString() : null,
                    items: payloadItems,
                },
            },
            {
                onSuccess: () => setNotice({ tone: 'ok', text: 'Quotation saved' }),
                onError: (err) => setNotice({ tone: 'error', text: err.message }),
            },
        )
    }

    if (!canView) {
        return (
            <div className="mt-4">
                <PageHeader eyebrow="Quotations" title="Unavailable" description="Missing permission." />
            </div>
        )
    }

    if (!isNew && isPending) {
        return <div className="mt-6 h-72 max-w-4xl skeleton-shimmer rounded-[3px]" />
    }

    if (!isNew && (isError || !quote)) {
        return (
            <div className="mt-4">
                <PageHeader
                    eyebrow="Quotations"
                    title="Not found"
                    description={error?.message ?? 'Quotation could not be loaded.'}
                />
            </div>
        )
    }

    return (
        <div className="mt-4">
            <PageHeader
                eyebrow="Quotations"
                title={isNew ? 'New quotation' : quote!.number}
                description={
                    isNew
                        ? 'Create a customer-specific quote with services, packages, and optional items.'
                        : `${STATUS_LABELS[quote!.status]} · ${quote!.customer?.displayName ?? 'Customer'}`
                }
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Link to="/clients/quotations" className={ghostActionClass}>
                            <ArrowLeft size={15} />
                            Back
                        </Link>
                        {!isNew && quote?.hasPdf ? (
                            <button
                                type="button"
                                className={ghostActionClass}
                                disabled={busy}
                                onClick={() =>
                                    void downloadQuotationPdf(quote.id, `${quote.number}.pdf`).catch(
                                        (err: Error) => setNotice({ tone: 'error', text: err.message }),
                                    )
                                }
                            >
                                <Download size={15} />
                                Download PDF
                            </button>
                        ) : null}
                        {!isNew && canManage ? (
                            <button
                                type="button"
                                className={ghostActionClass}
                                disabled={busy}
                                onClick={() =>
                                    generatePdf.mutate(quote!.id, {
                                        onSuccess: () => setNotice({ tone: 'ok', text: 'PDF generated' }),
                                        onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                    })
                                }
                            >
                                <FileText size={15} />
                                {quote?.hasPdf ? 'Regenerate PDF' : 'Generate PDF'}
                            </button>
                        ) : null}
                        {!isNew && canShare && quote && quote.status !== 'DRAFT' ? (
                            <button
                                type="button"
                                className={ghostActionClass}
                                onClick={() => setShareOpen(true)}
                            >
                                <Link2 size={15} />
                                Share
                            </button>
                        ) : null}
                        {canManage && editable ? (
                            <button type="button" className={primaryActionClass} disabled={busy} onClick={save}>
                                {isNew ? 'Create' : 'Save'}
                            </button>
                        ) : null}
                    </div>
                }
            />

            <div className="mt-6 max-w-4xl space-y-5">
                <Notice notice={notice} />

                {!isNew && canManage ? (
                    <div className="flex flex-wrap gap-2">
                        {quote!.status === 'DRAFT' ? (
                            <button
                                type="button"
                                className={ghostActionClass}
                                disabled={busy}
                                onClick={() =>
                                    changeStatus.mutate(
                                        { id: quote!.id, action: 'send' },
                                        {
                                            onSuccess: () => setNotice({ tone: 'ok', text: 'Marked as sent' }),
                                            onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                        },
                                    )
                                }
                            >
                                Mark sent
                            </button>
                        ) : null}
                        {quote!.status === 'SENT' ? (
                            <>
                                <button
                                    type="button"
                                    className={ghostActionClass}
                                    disabled={busy}
                                    onClick={() =>
                                        changeStatus.mutate(
                                            { id: quote!.id, action: 'accept' },
                                            {
                                                onSuccess: () =>
                                                    setNotice({ tone: 'ok', text: 'Quotation accepted' }),
                                                onError: (err) =>
                                                    setNotice({ tone: 'error', text: err.message }),
                                            },
                                        )
                                    }
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    className={ghostActionClass}
                                    disabled={busy}
                                    onClick={() =>
                                        changeStatus.mutate(
                                            { id: quote!.id, action: 'decline' },
                                            {
                                                onSuccess: () =>
                                                    setNotice({ tone: 'ok', text: 'Quotation declined' }),
                                                onError: (err) =>
                                                    setNotice({ tone: 'error', text: err.message }),
                                            },
                                        )
                                    }
                                >
                                    Decline
                                </button>
                                <button
                                    type="button"
                                    className={ghostActionClass}
                                    disabled={busy}
                                    onClick={() =>
                                        changeStatus.mutate(
                                            { id: quote!.id, action: 'expire' },
                                            {
                                                onSuccess: () =>
                                                    setNotice({ tone: 'ok', text: 'Quotation expired' }),
                                                onError: (err) =>
                                                    setNotice({ tone: 'error', text: err.message }),
                                            },
                                        )
                                    }
                                >
                                    Expire
                                </button>
                            </>
                        ) : null}
                        {quote!.status === 'ACCEPTED' ? (
                            <button
                                type="button"
                                className={primaryActionClass}
                                disabled={busy}
                                onClick={() =>
                                    convert.mutate(quote!.id, {
                                        onSuccess: (result) =>
                                            setNotice({
                                                tone: 'ok',
                                                text: `Converted to booking ${result.booking.id.slice(0, 8)}…`,
                                            }),
                                        onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                    })
                                }
                            >
                                Convert to booking
                            </button>
                        ) : null}
                        {quote!.status === 'DRAFT' ? (
                            <button
                                type="button"
                                className={`${ghostActionClass} text-red-800`}
                                disabled={busy}
                                onClick={() =>
                                    remove.mutate(quote!.id, {
                                        onSuccess: () => navigate('/clients/quotations'),
                                        onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                    })
                                }
                            >
                                Delete draft
                            </button>
                        ) : null}
                        {quote?.booking ? (
                            <p className="w-full text-sm text-ink/60">
                                Linked booking: {quote.booking.id} · {quote.booking.status} ·{' '}
                                {quote.booking.total}
                            </p>
                        ) : null}
                    </div>
                ) : null}

                <div className="space-y-4 rounded-[3px] border border-royal/10 bg-white/70 p-5">
                    {isNew ? (
                        <label className="block">
                            <span className={labelClass}>Customer</span>
                            <input
                                className={fieldClass}
                                placeholder="Search customers by name or email"
                                value={customerQ}
                                onChange={(event) => setCustomerQ(event.target.value)}
                            />
                            <select
                                className={`${selectClass} mt-2 w-full px-2`}
                                value={customerUserId}
                                onChange={(event) => setCustomerUserId(event.target.value)}
                            >
                                <option value="">Select customer…</option>
                                {(customersData?.items ?? []).map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
                                            user.email ||
                                            user.id}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                            <span className={labelClass}>Title</span>
                            <input
                                className={fieldClass}
                                value={title}
                                disabled={!canManage || !editable}
                                onChange={(event) => setTitle(event.target.value)}
                            />
                        </label>
                        <label className="block">
                            <span className={labelClass}>Currency</span>
                            <select
                                className={`${selectClass} w-full px-2`}
                                value={currency}
                                disabled={!canManage || !editable}
                                onChange={(event) => setCurrency(event.target.value)}
                            >
                                <option value="PHP">PHP</option>
                                <option value="USD">USD</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className={labelClass}>Valid until</span>
                            <input
                                type="date"
                                className={fieldClass}
                                value={validUntil}
                                disabled={!canManage || !editable}
                                onChange={(event) => setValidUntil(event.target.value)}
                            />
                        </label>
                        <label className="block sm:col-span-2">
                            <span className={labelClass}>Message to customer</span>
                            <textarea
                                className={fieldClass}
                                rows={3}
                                value={customerMessage}
                                disabled={!canManage || !editable}
                                onChange={(event) => setCustomerMessage(event.target.value)}
                            />
                        </label>
                        <label className="block sm:col-span-2">
                            <span className={labelClass}>Internal notes</span>
                            <textarea
                                className={fieldClass}
                                rows={2}
                                value={notes}
                                disabled={!canManage || !editable}
                                onChange={(event) => setNotes(event.target.value)}
                            />
                        </label>
                    </div>
                </div>

                <div className="space-y-3 rounded-[3px] border border-royal/10 bg-white/70 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-medium text-royal">Line items</h2>
                        {canManage && editable ? (
                            <button
                                type="button"
                                className={ghostActionClass}
                                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                            >
                                <Plus size={15} />
                                Add item
                            </button>
                        ) : null}
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div
                                key={item.key}
                                className="grid gap-2 rounded-[3px] border border-royal/10 p-3 sm:grid-cols-12"
                            >
                                <label className="block sm:col-span-2">
                                    <span className={labelClass}>Kind</span>
                                    <select
                                        className={`${selectClass} w-full px-2`}
                                        value={item.kind}
                                        disabled={!canManage || !editable}
                                        onChange={(event) => {
                                            const kind = event.target.value as QuotationItemKind
                                            setItems((prev) =>
                                                prev.map((row, i) =>
                                                    i === index
                                                        ? {
                                                              ...row,
                                                              kind,
                                                              isOptional:
                                                                  kind === 'OPTIONAL' ? true : row.isOptional,
                                                          }
                                                        : row,
                                                ),
                                            )
                                        }}
                                    >
                                        {(Object.keys(KIND_LABELS) as QuotationItemKind[]).map((kind) => (
                                            <option key={kind} value={kind}>
                                                {KIND_LABELS[kind]}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block sm:col-span-4">
                                    <span className={labelClass}>Title</span>
                                    <input
                                        className={fieldClass}
                                        value={item.title}
                                        disabled={!canManage || !editable}
                                        onChange={(event) =>
                                            setItems((prev) =>
                                                prev.map((row, i) =>
                                                    i === index ? { ...row, title: event.target.value } : row,
                                                ),
                                            )
                                        }
                                    />
                                </label>
                                <label className="block sm:col-span-2">
                                    <span className={labelClass}>Qty</span>
                                    <input
                                        type="number"
                                        min={1}
                                        className={fieldClass}
                                        value={item.quantity}
                                        disabled={!canManage || !editable}
                                        onChange={(event) =>
                                            setItems((prev) =>
                                                prev.map((row, i) =>
                                                    i === index
                                                        ? {
                                                              ...row,
                                                              quantity: Math.max(
                                                                  1,
                                                                  Number(event.target.value) || 1,
                                                              ),
                                                          }
                                                        : row,
                                                ),
                                            )
                                        }
                                    />
                                </label>
                                <label className="block sm:col-span-3">
                                    <span className={labelClass}>Unit ({currency})</span>
                                    <input
                                        className={fieldClass}
                                        value={item.unitMajor}
                                        disabled={!canManage || !editable}
                                        onChange={(event) =>
                                            setItems((prev) =>
                                                prev.map((row, i) =>
                                                    i === index
                                                        ? { ...row, unitMajor: event.target.value }
                                                        : row,
                                                ),
                                            )
                                        }
                                    />
                                </label>
                                <div className="flex items-end justify-end sm:col-span-1">
                                    {canManage && editable && items.length > 1 ? (
                                        <button
                                            type="button"
                                            className="pb-2 text-red-800"
                                            onClick={() =>
                                                setItems((prev) => prev.filter((_, i) => i !== index))
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    ) : null}
                                </div>
                                <label className="block sm:col-span-8">
                                    <span className={labelClass}>Description</span>
                                    <input
                                        className={fieldClass}
                                        value={item.description}
                                        disabled={!canManage || !editable}
                                        onChange={(event) =>
                                            setItems((prev) =>
                                                prev.map((row, i) =>
                                                    i === index
                                                        ? { ...row, description: event.target.value }
                                                        : row,
                                                ),
                                            )
                                        }
                                    />
                                </label>
                                <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink/70 sm:col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={item.isOptional}
                                        disabled={!canManage || !editable}
                                        onChange={(event) =>
                                            setItems((prev) =>
                                                prev.map((row, i) =>
                                                    i === index
                                                        ? { ...row, isOptional: event.target.checked }
                                                        : row,
                                                ),
                                            )
                                        }
                                    />
                                    Optional
                                </label>
                                <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink/70 sm:col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={item.selected}
                                        disabled={!canManage || !editable}
                                        onChange={(event) =>
                                            setItems((prev) =>
                                                prev.map((row, i) =>
                                                    i === index
                                                        ? { ...row, selected: event.target.checked }
                                                        : row,
                                                ),
                                            )
                                        }
                                    />
                                    Selected
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-royal/10 pt-3 text-sm text-ink/75">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{totals.format(totals.subtotal)}</span>
                        </div>
                        <div className="mt-1 flex justify-between">
                            <span>Optional (selected)</span>
                            <span className="tabular-nums">{totals.format(totals.optional)}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-base font-medium text-royal">
                            <span>Total</span>
                            <span className="tabular-nums">{totals.format(totals.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <QuotationShareDialog
                quotation={quote ?? null}
                open={shareOpen}
                onClose={() => setShareOpen(false)}
            />
        </div>
    )
}
