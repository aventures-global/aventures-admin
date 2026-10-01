import { ArrowLeft, ChevronDown, Clock3, Info, Lock, MapPin, Sparkles, Star } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import EditableImage from '../../components/cms/EditableImage'
import EditableList from '../../components/cms/EditableList'
import EditableText from '../../components/cms/EditableText'
import EditorToolbar from '../../components/cms/EditorToolbar'
import GalleryEditor from '../../components/cms/GalleryEditor'
import ItineraryEditor from '../../components/cms/ItineraryEditor'
import SectionTabs from '../../components/cms/SectionTabs'
import { useCreateTour, useDeleteTour, useTour, useUpdateTour } from '../../hooks/useTours'
import { heroCoverFocus } from '../../lib/coverFocus'
import { fieldClass, labelClass } from '../../lib/formStyles'
import {
    EMPTY_TOUR,
    cleanDraft,
    slugify,
    toDraft,
    validateDraft,
    type DraftErrors,
} from '../../lib/tourDraft'
import { REGION_OPTIONS, type Tour, type TourInput, type TourRegion } from '../../types/tour'

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'trips', label: 'Organized Trips' },
    { id: 'flights', label: 'Flights' },
    { id: 'hotels', label: 'Hotels' },
    { id: 'cars', label: 'Cars' },
] as const

type TabId = (typeof TABS)[number]['id']

type SetField = <K extends keyof TourInput>(field: K, value: TourInput[K]) => void

export default function DestinationEditor() {
    const { slug } = useParams<{ slug: string }>()
    return <EditorScreen key={slug ?? 'new'} slug={slug} />
}

function EditorScreen({ slug }: { slug: string | undefined }) {
    const { data: tour, isPending, error } = useTour(slug)

    if (!slug) return <Editor tour={null} />
    if (isPending) return <EditorSkeleton />
    if (error || !tour) {
        return (
            <div className="rounded-xl border border-white/10 px-6 py-16 text-center">
                <p className="font-serif text-2xl text-white">Destination not found</p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-silver/70">
                    {error?.message ?? 'It may have been renamed or deleted.'}
                </p>
                <Link
                    to=".."
                    relative="path"
                    className="mt-6 inline-block text-sm text-gold transition hover:text-ivory"
                >
                    Back to destinations
                </Link>
            </div>
        )
    }
    return <Editor tour={tour} />
}

function EditorSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="h-[52svh] skeleton-shimmer" />
            <div className="grid gap-10 p-8 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-3">
                    <div className="h-4 w-40 skeleton-shimmer rounded" />
                    <div className="h-4 w-32 skeleton-shimmer rounded" />
                </div>
                <div className="space-y-4">
                    <div className="h-5 w-2/3 skeleton-shimmer rounded" />
                    <div className="h-4 w-full skeleton-shimmer rounded" />
                    <div className="h-4 w-5/6 skeleton-shimmer rounded" />
                </div>
            </div>
        </div>
    )
}

function Editor({ tour }: { tour: Tour | null }) {
    const isNew = tour === null
    const navigate = useNavigate()
    const createTour = useCreateTour()
    const updateTour = useUpdateTour()
    const deleteTour = useDeleteTour()

    const [baseline, setBaseline] = useState<TourInput>(() => (tour ? toDraft(tour) : EMPTY_TOUR))
    const [draft, setDraft] = useState<TourInput>(baseline)
    const [slugTouched, setSlugTouched] = useState(!isNew)
    const [tab, setTab] = useState<TabId>('overview')
    const [errors, setErrors] = useState<DraftErrors | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const skipGuardRef = useRef(false)

    const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
    const saving = createTour.isPending || updateTour.isPending
    const invalid = (field: keyof TourInput) => Boolean(errors?.fields[field])

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
        if (field === 'title' && !slugTouched) next.slug = slugify(String(value))
        setDraft(next)
        if (errors) {
            const result = validateDraft(next)
            setErrors(result.messages.length > 0 ? result : null)
        }
    }

    const leaveTo = (to: string) => {
        skipGuardRef.current = true
        navigate(to, { relative: 'path', replace: true })
    }

    const save = async () => {
        const result = validateDraft(draft)
        setErrors(result.messages.length > 0 ? result : null)
        setSaveError(null)
        if (result.messages.length > 0) return

        const input = cleanDraft(draft)
        try {
            const saved = isNew
                ? await createTour.mutateAsync(input)
                : await updateTour.mutateAsync({ slug: tour.slug, input })
            const next = toDraft(saved)
            setBaseline(next)
            setDraft(next)
            setNotice(isNew ? 'Destination created' : 'Changes saved')
            if (isNew || saved.slug !== tour.slug) leaveTo(`../${saved.slug}`)
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Could not save destination')
        }
    }

    const discard = () => {
        setDraft(baseline)
        setErrors(null)
        setSaveError(null)
        if (isNew) setSlugTouched(false)
    }

    const remove = async () => {
        if (!tour) return
        try {
            await deleteTour.mutateAsync(tour.slug)
            setConfirmDelete(false)
            leaveTo('..')
        } catch (err) {
            setConfirmDelete(false)
            setSaveError(err instanceof Error ? err.message : 'Could not delete destination')
        }
    }

    const durationText = draft.duration.trim().toLowerCase() || 'multi-day'

    return (
        <div>
            <EditorToolbar
                backTo=".."
                backLabel="Destinations"
                dirty={dirty}
                saving={saving}
                isNew={isNew}
                onSave={() => void save()}
                onDiscard={discard}
                onDelete={isNew ? undefined : () => setConfirmDelete(true)}
            />

            <div className="card-surface mb-5 grid gap-4 rounded-xl border border-white/10 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <div>
                    <label htmlFor="destination-slug" className={labelClass}>
                        URL slug
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="shrink-0 text-sm text-silver/50">/destinations/</span>
                        <input
                            id="destination-slug"
                            value={draft.slug}
                            placeholder="my-destination"
                            onChange={(event) => {
                                setSlugTouched(true)
                                setField('slug', event.target.value.toLowerCase())
                            }}
                            className={`${fieldClass} ${invalid('slug') ? 'border-red-400/70' : ''}`}
                        />
                    </div>
                    {!isNew && draft.slug !== baseline.slug ? (
                        <p className="mt-1.5 text-xs text-gold/80">
                            Changing the slug breaks existing links to this destination.
                        </p>
                    ) : null}
                </div>
                <div className="sm:self-start">
                    <label htmlFor="destination-region" className={labelClass}>
                        Region
                    </label>
                    <div className="relative">
                        <select
                            id="destination-region"
                            value={draft.region}
                            onChange={(event) => setField('region', event.target.value as TourRegion)}
                            className={`${fieldClass} cursor-pointer appearance-none pr-8`}
                        >
                            {REGION_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            strokeWidth={1.6}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gold/70"
                            aria-hidden
                        />
                    </div>
                </div>
                <button
                    type="button"
                    aria-pressed={draft.featured}
                    onClick={() => setField('featured', !draft.featured)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        draft.featured
                            ? 'border-gold/50 bg-gold/10 text-gold'
                            : 'border-white/15 text-silver/70 hover:border-gold/40 hover:text-gold'
                    }`}
                >
                    <Star
                        size={15}
                        strokeWidth={1.75}
                        className={draft.featured ? 'fill-gold' : ''}
                        aria-hidden
                    />
                    {draft.featured ? 'Featured on home page' : 'Not featured'}
                </button>
            </div>

            {errors || saveError || notice ? (
                <div className="mb-5 space-y-2">
                    {saveError ? (
                        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            {saveError}
                        </p>
                    ) : null}
                    {errors ? (
                        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            <p>Fix these before saving:</p>
                            <ul className="mt-1 list-disc pl-5 text-red-300/90">
                                {errors.messages.map((message) => (
                                    <li key={message}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {notice ? (
                        <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                            {notice}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <p className="mb-3 flex items-center gap-2 text-xs text-silver/50">
                <Info size={13} strokeWidth={1.6} aria-hidden />
                This is the live page layout. Click any text or image to edit it.
            </p>

            <div className="@container overflow-hidden rounded-2xl border border-white/10 bg-ink">
                <div className="relative h-[60svh] min-h-[24rem] overflow-hidden @4xl:h-[56svh]">
                    <EditableImage
                        className="absolute inset-0"
                        src={draft.coverImage}
                        alt=""
                        label="Cover image"
                        imgClassName={`object-cover ${heroCoverFocus(tour?.id)}`}
                        buttonClassName="right-4 top-4"
                        invalid={invalid('coverImage')}
                        onChange={(url) => setField('coverImage', url)}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/60" />

                    <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end px-5 sm:px-8">
                        <div className="grid items-end gap-8 @3xl:grid-cols-[0.85fr_1.15fr] @3xl:gap-14">
                            <div className="hidden h-56 @3xl:block" aria-hidden />
                            <div className="pointer-events-auto pb-8 @3xl:pb-10">
                                <span className="mb-4 inline-flex items-center gap-2 text-sm text-white/90">
                                    <ArrowLeft size={16} strokeWidth={1.5} />
                                    Back to destinations
                                </span>
                                <EditableText
                                    as="h1"
                                    className="text-3xl font-semibold text-white @xl:text-4xl @4xl:text-5xl"
                                    value={draft.title}
                                    label="Title"
                                    placeholder="Destination title"
                                    invalid={invalid('title')}
                                    onChange={(value) => setField('title', value)}
                                />
                                <EditableText
                                    className="mt-2 text-base text-white/80 @xl:text-lg"
                                    value={draft.tagline}
                                    label="Tagline"
                                    placeholder="A short tagline"
                                    invalid={invalid('tagline')}
                                    onChange={(value) => setField('tagline', value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-w-0 px-5 pb-12 sm:px-8">
                    <div className="grid min-w-0 items-stretch gap-8 @3xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] @3xl:gap-14">
                        <div className="relative z-10 flex min-w-0 flex-col overflow-hidden rounded-3xl @3xl:-mt-56 @3xl:h-[calc(100%+14rem)]">
                            <div aria-hidden className="h-44 shrink-0 bg-gold-band @3xl:h-56" />
                            <aside className="flex min-h-[22rem] flex-1 flex-col gap-7 bg-[#242424] px-6 py-8 sm:px-7">
                                <dl className="space-y-5">
                                    <SidePanelField icon={MapPin} term="Location">
                                        <EditableText
                                            as="dd"
                                            className="mt-1.5 text-sm text-silver/90"
                                            value={draft.location}
                                            label="Location"
                                            placeholder="Country or region"
                                            invalid={invalid('location')}
                                            onChange={(value) => setField('location', value)}
                                        />
                                    </SidePanelField>
                                    <SidePanelField icon={Clock3} term="Duration">
                                        <EditableText
                                            as="dd"
                                            className="mt-1.5 text-sm text-silver/90"
                                            value={draft.duration}
                                            label="Duration"
                                            placeholder="e.g. 5 Days / 4 Nights"
                                            invalid={invalid('duration')}
                                            onChange={(value) => setField('duration', value)}
                                        />
                                    </SidePanelField>
                                    <SidePanelField icon={Sparkles} term="Price">
                                        <EditableText
                                            as="dd"
                                            className="mt-1.5 text-sm text-silver/90"
                                            value={draft.startingPrice}
                                            label="Price"
                                            placeholder="e.g. From ₱45,000"
                                            invalid={invalid('startingPrice')}
                                            onChange={(value) => setField('startingPrice', value)}
                                        />
                                    </SidePanelField>
                                </dl>

                                <span className="btn-gold inline-flex w-fit cursor-default rounded-xl px-6 py-3 text-sm opacity-90">
                                    Inquire
                                </span>
                            </aside>
                        </div>

                        <div className="min-w-0 max-w-full pt-8 @3xl:pt-10">
                            <SectionTabs
                                label="Destination sections"
                                tabs={TABS}
                                value={tab}
                                onChange={(id) => setTab(id)}
                            />

                            <div className="pt-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={tab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        transition={{ duration: 0.28 }}
                                        className="min-w-0 max-w-full"
                                    >
                                        {tab === 'overview' && (
                                            <div className="space-y-10">
                                                <div>
                                                    <p className="text-sm uppercase tracking-[0.22em] text-gold">
                                                        {draft.location || 'Location'}
                                                    </p>
                                                    <div className="mt-3 max-w-2xl text-base leading-relaxed text-silver/90">
                                                        <EditableText
                                                            multiline
                                                            className="inline"
                                                            value={draft.shortDescription}
                                                            label="Short description"
                                                            placeholder="A short description of the journey"
                                                            invalid={invalid('shortDescription')}
                                                            onChange={(value) => setField('shortDescription', value)}
                                                        />{' '}
                                                        <span className="text-silver/45" title="Fixed text on the site">
                                                            This {durationText} itinerary is paced for discovery
                                                            rather than haste, with a host who stays with you from
                                                            arrival to departure.
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h2 className="font-serif text-2xl text-gold-gradient">Highlights</h2>
                                                    <div className="mt-5">
                                                        <EditableList
                                                            variant="cards"
                                                            itemLabel="highlight"
                                                            className="grid gap-3 @xl:grid-cols-2"
                                                            items={draft.highlights}
                                                            onChange={(items) => setField('highlights', items)}
                                                        />
                                                    </div>
                                                </div>

                                                <GalleryEditor
                                                    title={draft.title || 'Destination'}
                                                    images={draft.gallery}
                                                    onChange={(images) => setField('gallery', images)}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => setTab('trips')}
                                                    className="text-sm text-gold transition hover:text-ivory"
                                                >
                                                    View organized trips →
                                                </button>
                                            </div>
                                        )}

                                        {tab === 'trips' && (
                                            <TripsPanel
                                                draft={draft}
                                                setField={setField}
                                                invalid={invalid}
                                                showErrors={Boolean(errors)}
                                            />
                                        )}
                                        {tab === 'flights' && (
                                            <FixedServicePanel
                                                title="Flights"
                                                body={`Airfare into ${draft.location || 'this destination'} is arranged privately for each departure. Share your dates and preferred cabin, and we will source the most comfortable routing.`}
                                                ctaLabel="Request flights"
                                                extraLabel="Flights desk"
                                            />
                                        )}
                                        {tab === 'hotels' && (
                                            <FixedServicePanel
                                                title="Hotels"
                                                body="Stays are selected for setting, quiet, and ease of movement — not a public inventory list. Tell us how you like to sleep and we will shortlist the right rooms."
                                                ctaLabel="Request hotels"
                                                extraLabel="Hotels desk"
                                            />
                                        )}
                                        {tab === 'cars' && (
                                            <FixedServicePanel
                                                title="Cars"
                                                body="Airport greetings, private cars, and island transfers are arranged by inquiry alongside the journey. Share pickup details and we will match the right vehicle."
                                                ctaLabel="Request transfers"
                                                extraLabel="Cars desk"
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={blocker.state === 'blocked'}
                title="Leave without saving?"
                body="You have unsaved changes to this destination. They will be lost if you leave now."
                confirmLabel="Leave page"
                cancelLabel="Keep editing"
                tone="danger"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            />
            <ConfirmDialog
                open={confirmDelete}
                title="Delete this destination?"
                body={`“${baseline.title}” will be removed from the site. This cannot be undone.`}
                confirmLabel={deleteTour.isPending ? 'Deleting…' : 'Delete'}
                tone="danger"
                busy={deleteTour.isPending}
                onConfirm={() => void remove()}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    )
}

function SidePanelField({
    icon: Icon,
    term,
    children,
}: {
    icon: typeof MapPin
    term: string
    children: ReactNode
}) {
    return (
        <div>
            <dt className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold/70">
                <Icon size={12} strokeWidth={1.6} />
                {term}
            </dt>
            {children}
        </div>
    )
}

function TripsPanel({
    draft,
    setField,
    invalid,
    showErrors,
}: {
    draft: TourInput
    setField: SetField
    invalid: (field: keyof TourInput) => boolean
    showErrors: boolean
}) {
    return (
        <div className="space-y-8">
            <div className="rounded-2xl border border-white/8 bg-ink-card/70 p-6 sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Signature journey</p>
                <EditableText
                    as="h2"
                    className="mt-2 font-serif text-2xl text-white @xl:text-3xl"
                    value={draft.title}
                    label="Title"
                    placeholder="Destination title"
                    invalid={invalid('title')}
                    onChange={(value) => setField('title', value)}
                />
                <EditableText
                    className="mt-2 text-sm text-silver/75"
                    value={draft.tagline}
                    label="Tagline"
                    placeholder="A short tagline"
                    invalid={invalid('tagline')}
                    onChange={(value) => setField('tagline', value)}
                />
                <div className="mt-5 flex flex-wrap gap-3 text-xs">
                    <span className="rounded-full border border-gold/30 px-3.5 py-1.5 text-gold">
                        {draft.duration || 'Duration'}
                    </span>
                    <span className="rounded-full border border-white/15 px-3.5 py-1.5 text-white">
                        {draft.startingPrice || 'Price'}
                    </span>
                </div>
                <EditableText
                    multiline
                    className="mt-5 text-sm leading-relaxed text-silver/85"
                    value={draft.shortDescription}
                    label="Short description"
                    placeholder="A short description of the journey"
                    invalid={invalid('shortDescription')}
                    onChange={(value) => setField('shortDescription', value)}
                />
            </div>

            <div>
                <h3 className="font-serif text-xl text-gold-gradient">Itinerary</h3>
                <ItineraryEditor
                    days={draft.itinerary}
                    showErrors={showErrors}
                    onChange={(days) => setField('itinerary', days)}
                />
            </div>

            <div className="grid gap-8 @xl:grid-cols-2">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Inclusions</h3>
                    <div className="mt-3">
                        <EditableList
                            variant="bullets"
                            itemLabel="inclusion"
                            className="space-y-2"
                            items={draft.inclusions}
                            onChange={(items) => setField('inclusions', items)}
                        />
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Exclusions</h3>
                    <div className="mt-3">
                        <EditableList
                            variant="bullets"
                            itemLabel="exclusion"
                            className="space-y-2"
                            items={draft.exclusions}
                            onChange={(items) => setField('exclusions', items)}
                        />
                    </div>
                </div>
            </div>

            <div className="relative rounded-2xl border border-gold/20 p-6 sm:p-7">
                <FixedBadge />
                <h3 className="font-serif text-xl text-gold-gradient">Prefer a custom pace?</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    Dates, room categories, and side trips can be reshaped around your group. This
                    itinerary is the starting sketch — not a fixed departure.
                </p>
                <span className="btn-gold mt-5 inline-flex cursor-default rounded-xl px-7 py-3 text-sm opacity-90">
                    Inquire about this tour
                </span>
            </div>
        </div>
    )
}

function FixedServicePanel({
    title,
    body,
    ctaLabel,
    extraLabel,
}: {
    title: string
    body: string
    ctaLabel: string
    extraLabel: string
}) {
    return (
        <div className="relative max-w-xl py-6">
            <FixedBadge />
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold/80">By request</p>
            <h2 className="mt-3 font-serif text-3xl text-gold-gradient">{title}</h2>
            <span className="mt-5 block h-px w-16 bg-gold/40" />
            <p className="mt-5 text-sm leading-relaxed text-silver/80">{body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
                <span className="btn-gold inline-flex cursor-default rounded-xl px-6 py-3 text-sm opacity-90">
                    {ctaLabel}
                </span>
                <span className="inline-flex cursor-default rounded-xl border border-white/15 px-6 py-3 text-sm text-silver/80">
                    {extraLabel}
                </span>
            </div>
        </div>
    )
}

function FixedBadge() {
    return (
        <span
            title="This copy is the same on every destination and is not editable here."
            className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-silver/60 sm:right-3 sm:top-3"
        >
            <Lock size={10} strokeWidth={1.8} aria-hidden />
            Fixed text
        </span>
    )
}
