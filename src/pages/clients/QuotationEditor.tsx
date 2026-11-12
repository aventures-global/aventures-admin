import { ArrowLeft, Download, Link2, Mail, Plus, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Notice from '../../components/cms/faqs/Notice'
import CustomerPicker, {
    type CustomerOption,
} from '../../components/quotations/CustomerPicker'
import ImportInquiryDialog from '../../components/quotations/ImportInquiryDialog'
import QuotationReadonlyView from '../../components/quotations/QuotationReadonlyView'
import QuotationShareDialog from '../../components/quotations/QuotationShareDialog'
import SelectMenu from '../../components/ui/SelectMenu'
import PageHeader from '../../components/PageHeader'
import { useNotice } from '../../hooks/useNotice'
import {
    useChangeQuotationStatus,
    useConvertQuotation,
    useCreateQuotation,
    useDeleteQuotation,
    useGenerateQuotationPdf,
    useQuotation,
    useSendQuotationEmail,
    useUpdateQuotation,
} from '../../hooks/useQuotations'
import { useAuth } from '../../lib/authContext'
import { readInquiryAttachmentFile } from '../../lib/inquiryImport'
import {
    fieldClass,
    ghostActionClass,
    labelClass,
    primaryActionClass,
    segmentActiveClass,
    segmentGroupClass,
} from '../../lib/formStyles'
import { listAdminUsers } from '../../services/adminUserService'
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
import type { AppUser } from '../../services/userService'

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

type FieldErrors = {
    customer?: string
    customerName?: string
    customerEmail?: string
    title?: string
    items?: string
    itemTitles?: Record<string, string>
    itemUnits?: Record<string, string>
    itemQuantities?: Record<string, string>
}

function looksLikeEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
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

function parseUnitMajor(value: string): number | null {
    const trimmed = value.trim().replace(/,/g, '')
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null
    return Math.round(Number(trimmed) * 100)
}

function toItemInputs(items: DraftItem[]): QuotationItemInput[] {
    return items.map((item, index) => ({
        kind: item.kind,
        title: item.title.trim(),
        description: item.description.trim() || null,
        quantity: item.quantity,
        unitCents: parseUnitMajor(item.unitMajor) ?? centsFromMajor(item.unitMajor),
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
    const format = (cents: number) => formatMoney(cents, currency)
    return { subtotal, optional, total: subtotal + optional, format }
}

function formatMoney(cents: number, currency: string) {
    const code = currency.trim().toUpperCase() || 'USD'
    const amount = cents / 100
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    } catch {
        return `${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} ${code}`
    }
}

function invalidFieldClass(invalid: boolean) {
    return invalid ? 'border-red-500 focus:border-red-500' : ''
}

const KIND_OPTIONS = (Object.keys(KIND_LABELS) as QuotationItemKind[]).map((kind) => ({
    value: kind,
    label: KIND_LABELS[kind],
}))

function CapsuleToggle({
    label,
    checked,
    disabled,
    onChange,
}: {
    label: string
    checked: boolean
    disabled?: boolean
    onChange: (next: boolean) => void
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                checked
                    ? 'border-royal bg-royal/15 text-royal'
                    : 'border-admin-border bg-admin-surface text-ink/65 hover:border-royal/40 hover:text-royal'
            }`}
        >
            {label}
        </button>
    )
}

function personFromQuote(quote: Quotation | undefined): CustomerOption | null {
    if (!quote?.customer) return null
    return {
        id: quote.customer.id,
        email: quote.customer.email,
        firstName: quote.customer.firstName,
        lastName: quote.customer.lastName,
        profilePicture: quote.customer.profilePicture ?? null,
        displayName: quote.customer.displayName,
    }
}

function customerOptionFromUser(user: AppUser): CustomerOption {
    const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.id
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        displayName,
    }
}

function contactLabel(quote: Pick<Quotation, 'customer' | 'customerName' | 'customerEmail'>) {
    return quote.customer?.displayName || quote.customerName || quote.customerEmail || '—'
}

async function findRegisteredCustomerByEmail(email: string): Promise<CustomerOption | null> {
    const page = await listAdminUsers({
        q: email,
        scope: 'customers',
        role: 'all',
        sort: 'email',
        dir: 'asc',
        page: 1,
        limit: 8,
    })
    const match = page.items.find(
        (user) => user.email?.trim().toLowerCase() === email.trim().toLowerCase(),
    )
    return match ? customerOptionFromUser(match) : null
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
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null)
    const [unregisteredMode, setUnregisteredMode] = useState(false)
    const [customerName, setCustomerName] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [title, setTitle] = useState('')
    const currency = 'USD'
    const [notes, setNotes] = useState('')
    const [customerMessage, setCustomerMessage] = useState('')
    const [messageTab, setMessageTab] = useState<'message' | 'notes'>('message')
    const [validUntil, setValidUntil] = useState('')
    const [items, setItems] = useState<DraftItem[]>([emptyItem()])
    const [shareOpen, setShareOpen] = useState(false)
    const [notice, setNotice] = useNotice()
    const [attempted, setAttempted] = useState(false)
    const [errors, setErrors] = useState<FieldErrors>({})

    const titleRef = useRef<HTMLInputElement>(null)
    const customerSectionRef = useRef<HTMLDivElement>(null)
    const firstItemTitleRef = useRef<HTMLInputElement>(null)
    const [importOpen, setImportOpen] = useState(false)
    const [importingInquiry, setImportingInquiry] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)

    const create = useCreateQuotation()
    const update = useUpdateQuotation()
    const changeStatus = useChangeQuotationStatus()
    const generatePdf = useGenerateQuotationPdf()
    const sendEmail = useSendQuotationEmail()
    const convert = useConvertQuotation()
    const remove = useDeleteQuotation()

    useEffect(() => {
        if (!quote) return
        setCustomerUserId(quote.customer?.id ?? '')
        setSelectedCustomer(personFromQuote(quote))
        const unclaimed = !quote.accountLinked
        setUnregisteredMode(unclaimed)
        setCustomerName(quote.customerName ?? '')
        setCustomerEmail(quote.customerEmail ?? '')
        setTitle(quote.title)
        setNotes(quote.notes ?? '')
        setCustomerMessage(quote.customerMessage ?? '')
        setValidUntil(quote.validUntil ? quote.validUntil.slice(0, 10) : '')
        setItems(itemsFromQuote(quote))
    }, [quote])

    const handleCustomerChange = useCallback((next: CustomerOption | null) => {
        setSelectedCustomer(next)
        setCustomerUserId(next?.id ?? '')
        setUnregisteredMode(false)
        setCustomerName('')
        setCustomerEmail('')
        setErrors((prev) => ({
            ...prev,
            customer: undefined,
            customerName: undefined,
            customerEmail: undefined,
        }))
    }, [])

    const handleQuoteUnregistered = useCallback((searchText: string) => {
        setSelectedCustomer(null)
        setCustomerUserId('')
        setUnregisteredMode(true)
        if (looksLikeEmail(searchText)) {
            setCustomerEmail(searchText.trim().toLowerCase())
            setCustomerName('')
        } else {
            setCustomerName(searchText.trim())
            setCustomerEmail('')
        }
        setErrors((prev) => ({
            ...prev,
            customer: undefined,
            customerName: undefined,
            customerEmail: undefined,
        }))
    }, [])

    const clearUnregistered = useCallback(() => {
        setUnregisteredMode(false)
        setCustomerName('')
        setCustomerEmail('')
        setErrors((prev) => ({
            ...prev,
            customer: undefined,
            customerName: undefined,
            customerEmail: undefined,
        }))
    }, [])

    const applyInquiryImport = useCallback(
        async (file: File) => {
            setImportingInquiry(true)
            setImportError(null)
            try {
                const draft = await readInquiryAttachmentFile(file)
                const registered = await findRegisteredCustomerByEmail(draft.customerEmail)

                if (registered) {
                    setSelectedCustomer(registered)
                    setCustomerUserId(registered.id)
                    setUnregisteredMode(false)
                    setCustomerName('')
                    setCustomerEmail('')
                } else {
                    setSelectedCustomer(null)
                    setCustomerUserId('')
                    setUnregisteredMode(true)
                    setCustomerName(draft.customerName)
                    setCustomerEmail(draft.customerEmail)
                }

                setTitle(draft.title)
                setNotes(draft.notes)
                setMessageTab('notes')
                setErrors((prev) => ({
                    ...prev,
                    customer: undefined,
                    customerName: undefined,
                    customerEmail: undefined,
                    title: undefined,
                }))
                setImportOpen(false)
                setNotice({
                    tone: 'ok',
                    text: registered
                        ? `Inquiry imported and linked to ${registered.displayName}. Review the draft, add priced line items, then save.`
                        : 'Inquiry imported for an unregistered customer. Review the draft, add priced line items, then save.',
                })
                customerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } catch (err) {
                setImportError(
                    err instanceof Error ? err.message : 'Could not import this inquiry file',
                )
            } finally {
                setImportingInquiry(false)
            }
        },
        [setNotice],
    )

    const contactEditable = isNew || (quote?.status === 'DRAFT' && !quote.accountLinked)

    const totals = useMemo(() => liveTotals(items, currency), [items, currency])
    const editable = isNew || quote?.status === 'DRAFT' || quote?.status === 'SENT'
    const busy =
        create.isPending ||
        update.isPending ||
        changeStatus.isPending ||
        generatePdf.isPending ||
        sendEmail.isPending ||
        convert.isPending ||
        remove.isPending

    const handleSendEmail = () => {
        if (!quote) return
        sendEmail.mutate(quote.id, {
            onSuccess: (result) => {
                setNotice({
                    tone: 'ok',
                    text: result.share.url
                        ? `Email sent to customer · link ready`
                        : 'Email sent to customer',
                })
            },
            onError: (err) => setNotice({ tone: 'error', text: err.message }),
        })
    }

    const validate = (): FieldErrors => {
        const next: FieldErrors = {}
        if (isNew || contactEditable) {
            if (unregisteredMode) {
                if (!customerName.trim()) next.customerName = 'Customer name is required'
                if (!customerEmail.trim()) next.customerEmail = 'Customer email is required'
                else if (!looksLikeEmail(customerEmail)) next.customerEmail = 'Enter a valid email'
            } else if (!customerUserId) {
                next.customer = 'Select a customer or quote an unregistered customer'
            }
        }
        if (!title.trim()) next.title = 'Title is required'

        if (!items.length) {
            next.items = 'Add at least one line item'
        }

        const itemTitles: Record<string, string> = {}
        const itemUnits: Record<string, string> = {}
        const itemQuantities: Record<string, string> = {}
        for (const item of items) {
            if (!item.title.trim()) itemTitles[item.key] = 'Title is required'
            if (item.quantity < 1) itemQuantities[item.key] = 'Quantity must be at least 1'
            if (parseUnitMajor(item.unitMajor) == null) itemUnits[item.key] = 'Enter a valid unit price'
        }
        if (Object.keys(itemTitles).length) next.itemTitles = itemTitles
        if (Object.keys(itemUnits).length) next.itemUnits = itemUnits
        if (Object.keys(itemQuantities).length) next.itemQuantities = itemQuantities
        if (next.itemTitles || next.itemUnits || next.itemQuantities) {
            next.items = next.items ?? 'Fix line item errors before saving'
        }
        return next
    }

    const save = () => {
        setAttempted(true)
        const nextErrors = validate()
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length) {
            setNotice({ tone: 'error', text: 'Fill in the required fields before saving' })
            if (nextErrors.customer) customerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            else if (nextErrors.title) titleRef.current?.focus()
            else if (nextErrors.itemTitles || nextErrors.itemUnits || nextErrors.itemQuantities) {
                firstItemTitleRef.current?.focus()
            }
            return
        }

        const payloadItems = toItemInputs(items)

        if (isNew) {
            create.mutate(
                {
                    ...(unregisteredMode
                        ? {
                              customerName: customerName.trim(),
                              customerEmail: customerEmail.trim().toLowerCase(),
                          }
                        : { customerUserId }),
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
                    ...(contactEditable && unregisteredMode
                        ? {
                              customerName: customerName.trim(),
                              customerEmail: customerEmail.trim().toLowerCase(),
                          }
                        : {}),
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

    const primaryLabel = isNew ? 'Create' : 'Save'
    const showPrimary = canManage && editable

    if (!canView) {
        return (
            <div className="mt-4">
                <PageHeader eyebrow="Quotations" title="Unavailable" description="Missing permission." />
            </div>
        )
    }

    if (!isNew && isPending) {
        return <div className="mt-6 h-72 max-w-6xl skeleton-shimmer rounded-[3px]" />
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
            <Link
                to="/clients/quotations"
                className="inline-flex items-center gap-1.5 text-sm text-ink/60 transition hover:text-royal"
            >
                <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
                Quotations
            </Link>

            <div className="mt-4">
                <PageHeader
                    eyebrow="Quotations"
                    title={isNew ? 'New quotation' : quote!.number}
                    description={
                        isNew
                            ? 'Create a customer-specific quote, or import an aventure-inquiry.json attachment from an inquiry email.'
                            : `${STATUS_LABELS[quote!.status]} · ${quote!.customer?.displayName || quote!.customerName || 'Customer'}`
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {isNew && canManage ? (
                                <button
                                    type="button"
                                    className={ghostActionClass}
                                    disabled={busy || importingInquiry}
                                    onClick={() => {
                                        setImportError(null)
                                        setImportOpen(true)
                                    }}
                                >
                                    <Upload size={15} />
                                    Import inquiry
                                </button>
                            ) : null}
                            {!isNew && canManage ? (
                                <button
                                    type="button"
                                    className={ghostActionClass}
                                    disabled={busy}
                                    onClick={() =>
                                        generatePdf.mutate(quote!.id, {
                                            onSuccess: (result) => {
                                                void downloadQuotationPdf(
                                                    result.quotation.id,
                                                    `${result.quotation.number}.pdf`,
                                                )
                                                    .then(() =>
                                                        setNotice({
                                                            tone: 'ok',
                                                            text: 'PDF ready and downloading',
                                                        }),
                                                    )
                                                    .catch((err: Error) =>
                                                        setNotice({ tone: 'error', text: err.message }),
                                                    )
                                            },
                                            onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                        })
                                    }
                                >
                                    <Download size={15} />
                                    {generatePdf.isPending ? 'Preparing PDF…' : 'Download PDF'}
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
                            {showPrimary ? (
                                <button
                                    type="button"
                                    className={primaryActionClass}
                                    disabled={busy}
                                    onClick={save}
                                >
                                    {primaryLabel}
                                </button>
                            ) : null}
                        </div>
                    }
                />
            </div>

            <div className="mt-5 max-w-6xl space-y-4">
                <Notice notice={notice} />

                {!isNew && canManage ? (
                    <div className="flex flex-wrap gap-2">
                        {quote!.status === 'DRAFT' ? (
                            <>
                                <button
                                    type="button"
                                    className={primaryActionClass}
                                    disabled={busy}
                                    onClick={handleSendEmail}
                                >
                                    <Mail size={15} />
                                    {sendEmail.isPending ? 'Sending…' : 'Send email'}
                                </button>
                                <button
                                    type="button"
                                    className={ghostActionClass}
                                    disabled={busy}
                                    onClick={() =>
                                        changeStatus.mutate(
                                            { id: quote!.id, action: 'send' },
                                            {
                                                onSuccess: () =>
                                                    setNotice({ tone: 'ok', text: 'Marked as sent' }),
                                                onError: (err) =>
                                                    setNotice({ tone: 'error', text: err.message }),
                                            },
                                        )
                                    }
                                >
                                    Mark sent
                                </button>
                            </>
                        ) : null}
                        {quote!.status === 'SENT' ? (
                            <>
                                <button
                                    type="button"
                                    className={ghostActionClass}
                                    disabled={busy}
                                    onClick={handleSendEmail}
                                >
                                    <Mail size={15} />
                                    {sendEmail.isPending ? 'Sending…' : 'Resend email'}
                                </button>
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
                                className={`${ghostActionClass} text-red-600`}
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
                    </div>
                ) : null}

                {!editable && quote ? (
                    <QuotationReadonlyView quotation={quote} />
                ) : (
                <>
                <div
                    ref={customerSectionRef}
                    className="admin-panel grid gap-5 rounded-[3px] p-4 lg:grid-cols-2"
                >
                    <div className="space-y-3">
                        {(isNew || selectedCustomer || unregisteredMode || quote) && (
                            <div>
                                <span className={labelClass}>Customer</span>
                                {unregisteredMode ? (
                                    <div className="space-y-3 rounded-[3px] border border-admin-border bg-admin-surface p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-xs text-ink/55">
                                                Quoting someone who has not created an account yet. The
                                                quotation and booking will attach if they later sign up
                                                with this email.
                                            </p>
                                            {contactEditable && canManage ? (
                                                <button
                                                    type="button"
                                                    className="shrink-0 text-xs font-medium text-royal underline decoration-gold-deep underline-offset-2"
                                                    onClick={clearUnregistered}
                                                >
                                                    Search instead
                                                </button>
                                            ) : null}
                                        </div>
                                        <label className="block">
                                            <span className={labelClass}>Name</span>
                                            <input
                                                className={`${fieldClass} ${invalidFieldClass(attempted && Boolean(errors.customerName))}`}
                                                value={customerName}
                                                disabled={!canManage || !contactEditable}
                                                aria-invalid={
                                                    attempted && Boolean(errors.customerName)
                                                        ? true
                                                        : undefined
                                                }
                                                onChange={(event) => {
                                                    setCustomerName(event.target.value)
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        customerName: undefined,
                                                    }))
                                                }}
                                            />
                                            {attempted && errors.customerName ? (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {errors.customerName}
                                                </p>
                                            ) : null}
                                        </label>
                                        <label className="block">
                                            <span className={labelClass}>Email</span>
                                            <input
                                                type="email"
                                                className={`${fieldClass} ${invalidFieldClass(attempted && Boolean(errors.customerEmail))}`}
                                                value={customerEmail}
                                                disabled={!canManage || !contactEditable}
                                                aria-invalid={
                                                    attempted && Boolean(errors.customerEmail)
                                                        ? true
                                                        : undefined
                                                }
                                                onChange={(event) => {
                                                    setCustomerEmail(event.target.value)
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        customerEmail: undefined,
                                                    }))
                                                }}
                                            />
                                            {attempted && errors.customerEmail ? (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {errors.customerEmail}
                                                </p>
                                            ) : null}
                                        </label>
                                    </div>
                                ) : (
                                    <CustomerPicker
                                        value={customerUserId}
                                        selected={selectedCustomer}
                                        onChange={handleCustomerChange}
                                        onQuoteUnregistered={
                                            contactEditable && canManage
                                                ? handleQuoteUnregistered
                                                : undefined
                                        }
                                        invalid={attempted && Boolean(errors.customer)}
                                        disabled={!canManage || !editable}
                                        readOnly={!contactEditable}
                                    />
                                )}
                                {attempted && errors.customer ? (
                                    <p className="mt-1 text-xs text-red-600">{errors.customer}</p>
                                ) : null}
                            </div>
                        )}
                        <label className="block">
                            <span className={labelClass}>Title</span>
                            <input
                                ref={titleRef}
                                className={`${fieldClass} ${invalidFieldClass(attempted && Boolean(errors.title))}`}
                                value={title}
                                disabled={!canManage || !editable}
                                aria-invalid={attempted && Boolean(errors.title) ? true : undefined}
                                onChange={(event) => {
                                    setTitle(event.target.value)
                                    setErrors((prev) => ({ ...prev, title: undefined }))
                                }}
                            />
                            {attempted && errors.title ? (
                                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                            ) : null}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className={labelClass}>Currency</span>
                                <p className={`${fieldClass} flex items-center text-ink/70`}>USD</p>
                                <p className="mt-1 text-[11px] text-ink/45">
                                    Quotes are priced in USD. PHP is shown on the PDF when the customer prefers it.
                                </p>
                            </div>
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
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-col gap-3">
                        <div
                            role="tablist"
                            aria-label="Customer message and notes"
                            className={`${segmentGroupClass} w-fit`}
                        >
                            {(
                                [
                                    { id: 'message' as const, label: 'Message to customer' },
                                    { id: 'notes' as const, label: 'Internal notes' },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={messageTab === tab.id}
                                    onClick={() => setMessageTab(tab.id)}
                                    className={`h-full rounded-[2px] px-3.5 text-sm transition ${
                                        messageTab === tab.id
                                            ? segmentActiveClass
                                            : 'text-ink/55 hover:text-royal'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {messageTab === 'message' ? (
                            <label className="flex min-h-0 flex-1 flex-col">
                                <span className="sr-only">Message to customer</span>
                                <textarea
                                    className={`${fieldClass} min-h-[220px] flex-1 resize-y leading-relaxed`}
                                    rows={10}
                                    value={customerMessage}
                                    disabled={!canManage || !editable}
                                    placeholder="Optional note shown to the customer on the quotation"
                                    onChange={(event) => setCustomerMessage(event.target.value)}
                                />
                            </label>
                        ) : (
                            <label className="flex min-h-0 flex-1 flex-col">
                                <span className="sr-only">Internal notes</span>
                                <textarea
                                    className={`${fieldClass} min-h-[220px] flex-1 resize-y leading-relaxed`}
                                    rows={10}
                                    value={notes}
                                    disabled={!canManage || !editable}
                                    placeholder="Staff-only notes from the inquiry or planning details"
                                    onChange={(event) => setNotes(event.target.value)}
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                    <div className="admin-panel space-y-3 rounded-[3px] p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-medium text-ink">Line items</h2>
                                <p className="text-xs text-ink/45">Services, packages, and optional add-ons</p>
                            </div>
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

                        {attempted && errors.items ? (
                            <p className="text-xs text-red-600">{errors.items}</p>
                        ) : null}

                        <div className="space-y-3">
                            {items.map((item, index) => {
                                const titleInvalid = attempted && Boolean(errors.itemTitles?.[item.key])
                                const unitInvalid = attempted && Boolean(errors.itemUnits?.[item.key])
                                const qtyInvalid = attempted && Boolean(errors.itemQuantities?.[item.key])
                                const unitCents = parseUnitMajor(item.unitMajor)
                                const lineCents =
                                    unitCents != null ? unitCents * Math.max(1, item.quantity) : null

                                return (
                                    <div
                                        key={item.key}
                                        className="rounded-[3px] border border-admin-border bg-admin-bg/40 p-3.5"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-[3px] bg-royal/10 px-1.5 text-[11px] font-medium tabular-nums text-royal">
                                                    #{index + 1}
                                                </span>
                                                <SelectMenu
                                                    value={item.kind}
                                                    options={KIND_OPTIONS}
                                                    disabled={!canManage || !editable}
                                                    aria-label={`Item ${index + 1} kind`}
                                                    className="w-[140px]"
                                                    onChange={(kind) =>
                                                        setItems((prev) =>
                                                            prev.map((row, i) =>
                                                                i === index
                                                                    ? {
                                                                          ...row,
                                                                          kind,
                                                                          isOptional:
                                                                              kind === 'OPTIONAL'
                                                                                  ? true
                                                                                  : row.isOptional,
                                                                      }
                                                                    : row,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </div>
                                            {canManage && editable && items.length > 1 ? (
                                                <button
                                                    type="button"
                                                    className="rounded-[3px] p-1.5 text-ink/40 transition hover:bg-royal/[0.06] hover:text-red-600"
                                                    aria-label={`Remove item ${index + 1}`}
                                                    onClick={() =>
                                                        setItems((prev) => prev.filter((_, i) => i !== index))
                                                    }
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            ) : null}
                                        </div>

                                        <label className="block">
                                            <span className={labelClass}>Title</span>
                                            <input
                                                ref={index === 0 ? firstItemTitleRef : undefined}
                                                className={`${fieldClass} ${invalidFieldClass(titleInvalid)}`}
                                                value={item.title}
                                                disabled={!canManage || !editable}
                                                aria-invalid={titleInvalid || undefined}
                                                onChange={(event) =>
                                                    setItems((prev) =>
                                                        prev.map((row, i) =>
                                                            i === index
                                                                ? { ...row, title: event.target.value }
                                                                : row,
                                                        ),
                                                    )
                                                }
                                            />
                                            {titleInvalid ? (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {errors.itemTitles?.[item.key]}
                                                </p>
                                            ) : null}
                                        </label>

                                        <label className="mt-3 block">
                                            <span className={labelClass}>Description</span>
                                            <input
                                                className={fieldClass}
                                                value={item.description}
                                                disabled={!canManage || !editable}
                                                placeholder="Optional details for this line"
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

                                        <div className="mt-3 grid gap-3 sm:grid-cols-[100px_1fr_120px]">
                                            <label className="block">
                                                <span className={labelClass}>Qty</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className={`${fieldClass} ${invalidFieldClass(qtyInvalid)}`}
                                                    value={item.quantity}
                                                    disabled={!canManage || !editable}
                                                    aria-invalid={qtyInvalid || undefined}
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
                                            <label className="block">
                                                <span className={labelClass}>Unit ({currency})</span>
                                                <input
                                                    className={`${fieldClass} ${invalidFieldClass(unitInvalid)}`}
                                                    value={item.unitMajor}
                                                    disabled={!canManage || !editable}
                                                    inputMode="decimal"
                                                    aria-invalid={unitInvalid || undefined}
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
                                                {unitInvalid ? (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {errors.itemUnits?.[item.key]}
                                                    </p>
                                                ) : null}
                                            </label>
                                            <div className="block">
                                                <span className={labelClass}>Line total</span>
                                                <div className="flex h-[38px] items-center justify-end rounded-[3px] border border-transparent px-1 text-sm font-medium tabular-nums text-ink">
                                                    {lineCents != null
                                                        ? totals.format(lineCents)
                                                        : '—'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2 border-t border-admin-border/80 pt-3">
                                            <CapsuleToggle
                                                label="Optional"
                                                checked={item.isOptional}
                                                disabled={!canManage || !editable}
                                                onChange={(isOptional) =>
                                                    setItems((prev) =>
                                                        prev.map((row, i) =>
                                                            i === index ? { ...row, isOptional } : row,
                                                        ),
                                                    )
                                                }
                                            />
                                            <CapsuleToggle
                                                label="Selected"
                                                checked={item.selected}
                                                disabled={!canManage || !editable}
                                                onChange={(selected) =>
                                                    setItems((prev) =>
                                                        prev.map((row, i) =>
                                                            i === index ? { ...row, selected } : row,
                                                        ),
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {canManage && editable ? (
                            <button
                                type="button"
                                className={`${ghostActionClass} w-full justify-center`}
                                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                            >
                                <Plus size={15} />
                                Add another item
                            </button>
                        ) : null}
                    </div>

                    <aside className="admin-panel sticky top-4 space-y-2 rounded-[3px] p-4 text-sm">
                        <h2 className="text-xs font-medium uppercase tracking-wide text-ink/45">Totals</h2>
                        <div className="flex justify-between gap-3 text-ink/75">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{totals.format(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-ink/75">
                            <span>Optional</span>
                            <span className="tabular-nums">{totals.format(totals.optional)}</span>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-admin-border pt-2 text-base font-medium text-ink">
                            <span>Total</span>
                            <span className="tabular-nums text-royal">{totals.format(totals.total)}</span>
                        </div>
                    </aside>
                </div>
                </>
                )}

                {showPrimary ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-admin-border pt-4">
                        <Link to="/clients/quotations" className={ghostActionClass}>
                            Cancel
                        </Link>
                        <button
                            type="button"
                            className={primaryActionClass}
                            disabled={busy}
                            onClick={save}
                        >
                            {primaryLabel}
                        </button>
                    </div>
                ) : null}
            </div>

            <QuotationShareDialog
                quotation={quote ?? null}
                open={shareOpen}
                onClose={() => setShareOpen(false)}
            />
            <ImportInquiryDialog
                open={importOpen}
                busy={importingInquiry}
                error={importError}
                onClose={() => {
                    if (importingInquiry) return
                    setImportOpen(false)
                    setImportError(null)
                }}
                onImport={(file) => void applyInquiryImport(file)}
            />
        </div>
    )
}
