import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, ImagePlus, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import EditableImage from '../../components/cms/EditableImage'
import EditorToolbar from '../../components/cms/EditorToolbar'
import SafeImage from '../../components/ui/SafeImage'
import { IMAGE_ACCEPT, useImageUpload } from '../../hooks/useImageUpload'
import { useCreateMerch, useDeleteMerch, useMerch, useMerchCategories, useUpdateMerch } from '../../hooks/useMerch'
import { fieldClass, labelClass, linkClass } from '../../lib/formStyles'
import {
    EMPTY_MERCH,
    toMerchDraft,
    toMerchInput,
    validateMerchDraft,
    type MerchDraft,
    type MerchDraftErrors,
} from '../../lib/merchDraft'
import { publicSiteUrl } from '../../lib/publicSite'
import { slugify } from '../../lib/tourDraft'
import type { MerchCategory, MerchProduct } from '../../types/merch'

type SetField = <K extends keyof MerchDraft>(field: K, value: MerchDraft[K]) => void

export default function MerchEditor() {
    const { slug } = useParams<{ slug: string }>()
    return <EditorScreen key={slug ?? 'new'} slug={slug} />
}

function EditorScreen({ slug }: { slug: string | undefined }) {
    const { data: product, isPending: productPending, error: productError } = useMerch(slug)
    const { data: categories, isPending: categoriesPending, error: categoriesError } = useMerchCategories()
    const isPending = (Boolean(slug) && productPending) || categoriesPending
    const error = productError ?? categoriesError

    if (isPending) {
        return (
            <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
                <div className="aspect-square skeleton-paper rounded-[3px]" />
                <div className="h-96 skeleton-paper rounded-[3px]" />
            </div>
        )
    }
    if (error || !categories || (slug && !product)) {
        return (
            <div className="rounded-[3px] border border-royal/15 px-6 py-16 text-center">
                <p className="font-noto-serif text-2xl text-ink">
                    {categoriesError ? 'Could not load categories' : 'Product not found'}
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-ink/60">
                    {error?.message ?? 'It may have been renamed or deleted.'}
                </p>
                <Link
                    to=".."
                    relative="path"
                    className="mt-6 inline-block text-sm font-medium text-royal transition hover:text-gold-deep"
                >
                    Back to shop
                </Link>
            </div>
        )
    }
    return <Editor product={product ?? null} categories={categories} />
}

function Editor({ product, categories }: { product: MerchProduct | null; categories: MerchCategory[] }) {
    const isNew = product === null
    const navigate = useNavigate()
    const createMerch = useCreateMerch()
    const updateMerch = useUpdateMerch()
    const deleteMerch = useDeleteMerch()

    const [baseline, setBaseline] = useState<MerchDraft>(() =>
        product ? toMerchDraft(product) : { ...EMPTY_MERCH, categoryId: categories[0]?.id ?? '' },
    )
    const [draft, setDraft] = useState<MerchDraft>(baseline)
    const [slugTouched, setSlugTouched] = useState(!isNew)
    const [errors, setErrors] = useState<MerchDraftErrors | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const skipGuardRef = useRef(false)

    const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
    const saving = createMerch.isPending || updateMerch.isPending
    const invalid = (field: keyof MerchDraft) => Boolean(errors?.fields[field])

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !skipGuardRef.current && dirty && currentLocation.pathname !== nextLocation.pathname,
    )

    useEffect(() => {
        if (!dirty) return
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault()
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [dirty])

    useEffect(() => {
        if (!notice) return
        const timer = window.setTimeout(() => setNotice(null), 2500)
        return () => window.clearTimeout(timer)
    }, [notice])

    const setField: SetField = (field, value) => {
        setNotice(null)
        const next = { ...draft, [field]: value }
        if (field === 'name' && !slugTouched) next.slug = slugify(String(value))
        setDraft(next)
        if (errors) {
            const result = validateMerchDraft(next)
            setErrors(result.messages.length > 0 ? result : null)
        }
    }

    const leaveTo = (to: string) => {
        skipGuardRef.current = true
        navigate(to, { relative: 'path', replace: true })
    }

    const save = async () => {
        const result = validateMerchDraft(draft)
        setErrors(result.messages.length > 0 ? result : null)
        setSaveError(null)
        if (result.messages.length > 0) return

        const input = toMerchInput(draft)
        try {
            const saved = isNew
                ? await createMerch.mutateAsync(input)
                : await updateMerch.mutateAsync({ slug: product.slug, input })
            const next = toMerchDraft(saved)
            setBaseline(next)
            setDraft(next)
            setNotice(isNew ? 'Product created' : 'Changes saved')
            if (isNew || saved.slug !== product.slug) leaveTo(`../${saved.slug}`)
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Could not save product')
        }
    }

    const discard = () => {
        setDraft(baseline)
        setErrors(null)
        setSaveError(null)
        if (isNew) setSlugTouched(false)
    }

    const remove = async () => {
        if (!product) return
        try {
            await deleteMerch.mutateAsync(product.slug)
            setConfirmDelete(false)
            leaveTo('..')
        } catch (err) {
            setConfirmDelete(false)
            setSaveError(err instanceof Error ? err.message : 'Could not delete product')
        }
    }

    return (
        <div>
            <EditorToolbar
                backTo=".."
                backLabel="Shop"
                dirty={dirty}
                saving={saving}
                isNew={isNew}
                createLabel="Create product"
                onSave={() => void save()}
                onDiscard={discard}
                onDelete={isNew ? undefined : () => setConfirmDelete(true)}
            />

            {errors || saveError || notice ? (
                <div className="mb-5 space-y-2">
                    {saveError ? (
                        <p className="rounded-[3px] border border-red-700/25 bg-red-50 px-3 py-2 text-sm text-red-800">
                            {saveError}
                        </p>
                    ) : null}
                    {errors ? (
                        <div className="rounded-[3px] border border-red-700/25 bg-red-50 px-3 py-2 text-sm text-red-800">
                            <p>Fix these before saving:</p>
                            <ul className="mt-1 list-disc pl-5 text-red-800/90">
                                {errors.messages.map((message) => (
                                    <li key={message}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {notice ? (
                        <p className="rounded-[3px] border border-emerald-700/25 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            {notice}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
                <div className="space-y-5">
                    <div>
                        <p className={labelClass}>Cover image</p>
                        <EditableImage
                            className="relative aspect-square overflow-hidden rounded-[3px] border border-royal/15"
                            src={draft.coverImage}
                            alt={draft.name}
                            label="Cover image"
                            imgClassName="object-cover"
                            folder="merch"
                            invalid={invalid('coverImage')}
                            onChange={(url) => setField('coverImage', url)}
                        />
                        <p className="mt-1.5 text-xs text-ink/50">Shown on the shop grid and in link previews.</p>
                    </div>

                    <GalleryEditor images={draft.gallery} onChange={(gallery) => setField('gallery', gallery)} />
                </div>

                <div className="paper-card space-y-4 rounded-[3px] p-5">
                    <div>
                        <label htmlFor="merch-name" className={labelClass}>
                            Name
                        </label>
                        <input
                            id="merch-name"
                            value={draft.name}
                            placeholder="Journey Tee"
                            onChange={(event) => setField('name', event.target.value)}
                            className={`${fieldClass} ${invalid('name') ? 'border-red-600/70' : ''}`}
                        />
                    </div>

                    <div>
                        <label htmlFor="merch-slug" className={labelClass}>
                            URL slug
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="shrink-0 text-sm text-ink/50">/shop/</span>
                            <input
                                id="merch-slug"
                                value={draft.slug}
                                placeholder="journey-tee"
                                onChange={(event) => {
                                    setSlugTouched(true)
                                    setField('slug', event.target.value.toLowerCase())
                                }}
                                className={`${fieldClass} ${invalid('slug') ? 'border-red-600/70' : ''}`}
                            />
                            {!isNew ? (
                                <a
                                    href={publicSiteUrl(`/shop/${baseline.slug}`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="View on the public site"
                                    className="shrink-0 text-royal transition hover:text-gold-deep"
                                >
                                    <ExternalLink size={15} strokeWidth={1.75} aria-label="View on the public site" />
                                </a>
                            ) : null}
                        </div>
                        {!isNew && draft.slug !== baseline.slug ? (
                            <p className="mt-1.5 text-xs text-[#9b7512]">
                                Changing the slug breaks existing links to this product.
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="merch-tagline" className={labelClass}>
                            Tagline
                        </label>
                        <input
                            id="merch-tagline"
                            value={draft.tagline}
                            placeholder="Soft cotton, gold wordmark"
                            onChange={(event) => setField('tagline', event.target.value)}
                            className={`${fieldClass} ${invalid('tagline') ? 'border-red-600/70' : ''}`}
                        />
                    </div>

                    <div>
                        <label htmlFor="merch-description" className={labelClass}>
                            Description
                        </label>
                        <textarea
                            id="merch-description"
                            rows={5}
                            value={draft.description}
                            onChange={(event) => setField('description', event.target.value)}
                            className={`${fieldClass} resize-y ${invalid('description') ? 'border-red-600/70' : ''}`}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="merch-category" className={labelClass}>
                                Category
                            </label>
                            {categories.length === 0 ? (
                                <p className="rounded-[3px] border border-dashed border-royal/30 px-3 py-2 text-sm text-ink/60">
                                    No categories yet.{' '}
                                    <Link to="../?tab=categories" relative="path" className={linkClass}>
                                        Add one first
                                    </Link>
                                </p>
                            ) : (
                                <div className="relative">
                                    <select
                                        id="merch-category"
                                        value={draft.categoryId}
                                        onChange={(event) => setField('categoryId', event.target.value)}
                                        className={`${fieldClass} cursor-pointer appearance-none pr-8 ${
                                            invalid('categoryId') ? 'border-red-600/70' : ''
                                        }`}
                                    >
                                        {draft.categoryId ? null : <option value="">Choose a category</option>}
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
                            )}
                        </div>
                        <div>
                            <label htmlFor="merch-price" className={labelClass}>
                                Price (USD)
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/50">
                                    $
                                </span>
                                <input
                                    id="merch-price"
                                    inputMode="decimal"
                                    value={draft.price}
                                    placeholder="32.00"
                                    onChange={(event) => setField('price', event.target.value)}
                                    className={`${fieldClass} pl-6 ${invalid('price') ? 'border-red-600/70' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="merch-sizes" className={labelClass}>
                            Sizes
                        </label>
                        <input
                            id="merch-sizes"
                            value={draft.sizes}
                            placeholder="S, M, L, XL"
                            onChange={(event) => setField('sizes', event.target.value)}
                            className={fieldClass}
                        />
                        <p className="mt-1.5 text-xs text-ink/50">
                            Separate with commas. Leave empty if the product has one size.
                        </p>
                    </div>

                    <div>
                        <p className={labelClass}>Availability</p>
                        <div
                            role="group"
                            aria-label="Availability"
                            className="inline-flex items-center rounded-[3px] border border-royal/25 bg-white/60 p-0.5"
                        >
                            {[
                                { value: true, label: 'In stock' },
                                { value: false, label: 'Sold out' },
                            ].map((option) => (
                                <button
                                    key={option.label}
                                    type="button"
                                    aria-pressed={draft.inStock === option.value}
                                    onClick={() => setField('inStock', option.value)}
                                    className={`rounded-[2px] px-3 py-1 text-xs transition ${
                                        draft.inStock === option.value
                                            ? 'bg-royal text-cream'
                                            : 'text-ink/60 hover:text-royal'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1.5 text-xs text-ink/50">
                            Sold-out products stay on the shop but cannot be added to a cart.
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={blocker.state === 'blocked'}
                title="Leave without saving?"
                body="You have unsaved changes to this product. They will be lost if you leave now."
                confirmLabel="Leave page"
                cancelLabel="Keep editing"
                tone="danger"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            />
            <ConfirmDialog
                open={confirmDelete}
                title="Delete this product?"
                body={`“${baseline.name}” will be removed from the shop and from any customer carts. This cannot be undone.`}
                confirmLabel={deleteMerch.isPending ? 'Deleting…' : 'Delete'}
                tone="danger"
                busy={deleteMerch.isPending}
                onConfirm={() => void remove()}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    )
}

function GalleryEditor({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const { upload, isUploading, error } = useImageUpload('merch')

    const addFiles = async (files: File[]) => {
        if (!files.length) return
        const added: string[] = []
        for (const file of files) {
            const url = await upload(file)
            if (url) added.push(url)
        }
        if (added.length) onChange([...images, ...added])
    }

    const move = (from: number, to: number) => {
        if (to < 0 || to >= images.length) return
        const next = [...images]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        onChange(next)
    }

    return (
        <div>
            <p className={labelClass}>Gallery</p>
            <div className="grid grid-cols-3 gap-2">
                {images.map((src, index) => (
                    <div
                        key={`${src}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-[3px] border border-royal/15"
                    >
                        <SafeImage src={src} alt="" className="h-full w-full" imgClassName="object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 p-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                            <button
                                type="button"
                                onClick={() => move(index, index - 1)}
                                disabled={index === 0}
                                aria-label="Move image earlier"
                                className="rounded p-0.5 text-white transition hover:text-gold disabled:opacity-30"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange(images.filter((_, i) => i !== index))}
                                aria-label="Remove image"
                                className="rounded p-0.5 text-white transition hover:text-red-300"
                            >
                                <X size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => move(index, index + 1)}
                                disabled={index === images.length - 1}
                                aria-label="Move image later"
                                className="rounded p-0.5 text-white transition hover:text-gold disabled:opacity-30"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[3px] border border-dashed border-royal/30 text-xs text-ink/55 transition hover:border-royal hover:text-royal disabled:opacity-60"
                >
                    {isUploading ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden />
                    ) : (
                        <ImagePlus size={18} strokeWidth={1.5} aria-hidden />
                    )}
                    {isUploading ? 'Uploading…' : 'Add image'}
                </button>
            </div>
            {error ? <p className="mt-1.5 text-xs text-red-700">{error}</p> : null}
            <p className="mt-1.5 text-xs text-ink/50">
                Images on the product page, in this order. If empty, the cover image is used.
            </p>
            <input
                ref={inputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                className="hidden"
                onChange={(event) => {
                    void addFiles(Array.from(event.target.files ?? []))
                    event.target.value = ''
                }}
            />
        </div>
    )
}
