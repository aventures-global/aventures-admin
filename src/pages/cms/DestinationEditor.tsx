import { useQuery } from '@tanstack/react-query'
import {
    ArrowLeft,
    ArrowRight,
    CalendarClock,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Compass,
    Files,
    Info,
    Lock,
    Luggage,
    MapPin,
    Quote,
    Star,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import AddItemButton from '../../components/cms/AddItemButton'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import EditableImage from '../../components/cms/EditableImage'
import EditableText from '../../components/cms/EditableText'
import EditorToolbar from '../../components/cms/EditorToolbar'
import ItemControls from '../../components/cms/ItemControls'
import SafeImage from '../../components/ui/SafeImage'
import { useCreateTour, useDeleteTour, useTour, useTours, useUpdateTour } from '../../hooks/useTours'
import { cardCoverFocus, heroCoverFocus } from '../../lib/coverFocus'
import { EMPTY_EXPERIENCE } from '../../lib/destinationContent'
import { fieldClass, labelClass } from '../../lib/formStyles'
import {
    EMPTY_TOUR,
    cleanDraft,
    slugify,
    toDraft,
    validateDraft,
    type DraftErrors,
} from '../../lib/tourDraft'
import { listTestimonials, type Testimonial } from '../../services/testimonialService'
import {
    REGION_OPTIONS,
    type Tour,
    type TourExperience,
    type TourInput,
    type TourRegion,
} from '../../types/tour'

type SetField = <K extends keyof TourInput>(field: K, value: TourInput[K]) => void

const container = 'mx-auto w-full max-w-[84rem] px-6 @2xl:px-8 @5xl:px-12'
const lightEdit = 'bg-white/80'
const darkEdit = 'bg-black/30'
const TIP_ICONS = [CalendarClock, Luggage, Files, Compass]

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
            <div className="rounded-[3px] border border-royal/15 px-6 py-16 text-center">
                <p className="font-noto-serif text-2xl text-ink">Destination not found</p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-ink/60">
                    {error?.message ?? 'It may have been renamed or deleted.'}
                </p>
                <Link
                    to=".."
                    relative="path"
                    className="mt-6 inline-block text-sm font-medium text-royal transition hover:text-gold-deep"
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
        <div className="overflow-hidden rounded-2xl border border-royal/10">
            <div className="h-[34rem] skeleton-paper" />
            <div className="grid gap-10 p-8 lg:grid-cols-2">
                <div className="aspect-[4/3] skeleton-paper rounded-xl" />
                <div className="space-y-4">
                    <div className="h-4 w-24 skeleton-paper rounded" />
                    <div className="h-8 w-2/3 skeleton-paper rounded" />
                    <div className="h-4 w-full skeleton-paper rounded" />
                    <div className="h-4 w-5/6 skeleton-paper rounded" />
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
    const { data: allTours = [] } = useTours()
    const { data: testimonials = [] } = useQuery({ queryKey: ['testimonials'], queryFn: listTestimonials })

    const [baseline, setBaseline] = useState<TourInput>(() => (tour ? toDraft(tour) : EMPTY_TOUR))
    const [draft, setDraft] = useState<TourInput>(baseline)
    const [slugTouched, setSlugTouched] = useState(!isNew)
    const [errors, setErrors] = useState<DraftErrors | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const skipGuardRef = useRef(false)

    const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
    const saving = createTour.isPending || updateTour.isPending
    const invalid = (field: keyof TourInput) => Boolean(errors?.fields[field])
    const invalidItem = (key: string) => Boolean(errors?.items.has(key))

    const suggestedTours = useMemo(() => {
        const remaining = allTours.filter((item) => item.id !== tour?.id)
        const sameRegion = remaining.filter((item) => item.region === draft.region)
        const others = remaining.filter((item) => item.region !== draft.region)
        return [...sameRegion, ...others].slice(0, 3)
    }, [allTours, tour?.id, draft.region])

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

    const setExperience = (index: number, key: keyof TourExperience, value: string) => {
        setField(
            'experiences',
            draft.experiences.map((experience, i) => (i === index ? { ...experience, [key]: value } : experience)),
        )
    }

    const addExperience = () => setField('experiences', [...draft.experiences, { ...EMPTY_EXPERIENCE }])

    const moveExperience = (from: number, to: number) => {
        if (to < 0 || to >= draft.experiences.length) return
        const next = [...draft.experiences]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        setField('experiences', next)
    }

    const removeExperience = (index: number) => {
        if (draft.experiences.length <= 1) return
        setField(
            'experiences',
            draft.experiences.filter((_, i) => i !== index),
        )
    }

    const setListItem = (field: 'storyTitles' | 'travelTips', index: number, value: string) => {
        setField(
            field,
            draft[field].map((item, i) => (i === index ? value : item)),
        )
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

    const location = draft.location || 'this destination'

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

            <div className="paper-card mb-5 grid gap-4 rounded-[3px] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <div>
                    <label htmlFor="destination-slug" className={labelClass}>
                        URL slug
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="shrink-0 text-sm text-ink/50">/destinations/</span>
                        <input
                            id="destination-slug"
                            value={draft.slug}
                            placeholder="my-destination"
                            onChange={(event) => {
                                setSlugTouched(true)
                                setField('slug', event.target.value.toLowerCase())
                            }}
                            className={`${fieldClass} ${invalid('slug') ? 'border-red-600/70' : ''}`}
                        />
                    </div>
                    {!isNew && draft.slug !== baseline.slug ? (
                        <p className="mt-1.5 text-xs text-[#9b7512]">
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
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-royal/70"
                            aria-hidden
                        />
                    </div>
                </div>
                <button
                    type="button"
                    aria-pressed={draft.featured}
                    onClick={() => setField('featured', !draft.featured)}
                    className={`inline-flex items-center gap-2 rounded-[3px] border px-3 py-2 text-sm transition ${
                        draft.featured
                            ? 'border-royal bg-royal text-cream'
                            : 'border-royal/25 bg-white/60 text-ink/70 hover:border-royal hover:text-royal'
                    }`}
                >
                    <Star
                        size={15}
                        strokeWidth={1.75}
                        className={draft.featured ? 'fill-gold-deep text-gold-deep' : ''}
                        aria-hidden
                    />
                    {draft.featured ? 'Featured on home page' : 'Not featured'}
                </button>
                <div className="sm:col-span-3">
                    <label htmlFor="destination-seo" className={labelClass}>
                        SEO description
                    </label>
                    <textarea
                        id="destination-seo"
                        rows={2}
                        value={draft.shortDescription}
                        placeholder="One or two sentences shown in search results and link previews"
                        onChange={(event) => setField('shortDescription', event.target.value)}
                        className={`${fieldClass} resize-y ${invalid('shortDescription') ? 'border-red-600/70' : ''}`}
                    />
                </div>
            </div>

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

            <p className="mb-3 flex items-center gap-2 text-xs text-ink/55">
                <Info size={13} strokeWidth={1.6} aria-hidden />
                This is the live page layout. Click any text or image to edit it. Sections marked
                “Fixed” are the same on every destination.
            </p>

            <div className="@container luxury-paper overflow-hidden rounded-2xl border border-royal/10 font-poppins text-ink">
                <section className="relative flex h-[34rem] items-end overflow-hidden">
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
                    <div className="pointer-events-none absolute inset-0 bg-[#071831]/22" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-[#071831]/85 via-[#071831]/42 to-transparent" />
                    <div className={`${container} pointer-events-none relative z-10 pb-12 @2xl:pb-16`}>
                        <span className="inline-flex items-center gap-2 text-sm text-white/80">
                            <ArrowLeft size={16} />
                            Back to destinations
                        </span>
                        <div className="pointer-events-auto mt-7 max-w-4xl">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gold">
                                <MapPin size={14} className="shrink-0" />
                                <EditableText
                                    as="span"
                                    className="min-w-24"
                                    editClassName={darkEdit}
                                    value={draft.location}
                                    label="Location"
                                    placeholder="City, country"
                                    invalid={invalid('location')}
                                    onChange={(value) => setField('location', value)}
                                />
                            </div>
                            <EditableText
                                as="h1"
                                className="mt-3 font-noto-serif text-5xl leading-[1.04] text-white @2xl:text-6xl @5xl:text-7xl"
                                editClassName={darkEdit}
                                value={draft.title}
                                label="Title"
                                placeholder="Destination title"
                                invalid={invalid('title')}
                                onChange={(value) => setField('title', value)}
                            />
                            <EditableText
                                className="mt-4 max-w-2xl text-base leading-7 text-white/75 @2xl:text-lg"
                                editClassName={darkEdit}
                                value={draft.tagline}
                                label="Tagline"
                                placeholder="A short tagline"
                                invalid={invalid('tagline')}
                                onChange={(value) => setField('tagline', value)}
                            />
                            <span className="mt-7 inline-flex items-center gap-2 border border-white/45 bg-white/10 px-6 py-3 text-sm text-white backdrop-blur-sm">
                                Plan this destination <ArrowRight size={15} />
                            </span>
                        </div>
                    </div>
                </section>

                {draft.experiences.map((experience, index) => {
                    const reverse = index % 2 === 1
                    const sectionLabel = `section ${index + 1}`
                    const eyebrow = experience.eyebrow.trim() || 'this section'
                    return (
                        <section key={index} className={`py-16 @2xl:py-24 ${reverse ? 'bg-white/45' : ''}`}>
                            {index === 0 ? (
                                <div className={`${container} relative mb-6 @2xl:mb-20`}>
                                    <FixedBadge />
                                    <p className="text-xs uppercase tracking-[0.28em] text-[#9b7512]">
                                        Things to see · Digital Experience
                                    </p>
                                    <h2 className="mt-3 font-noto-serif text-4xl text-royal @2xl:text-5xl">
                                        Explore before you travel
                                    </h2>
                                    <p className="mt-5 text-sm leading-7 text-ink/55">
                                        Begin with what to see, then continue through the flavors, experiences,
                                        culture, and everyday life that give this destination its character.
                                    </p>
                                </div>
                            ) : null}
                            <div className={`${container} mb-5 flex items-center justify-between gap-3`}>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
                                    Section {index + 1} of {draft.experiences.length}
                                </span>
                                <ItemControls
                                    tone="light"
                                    index={index}
                                    count={draft.experiences.length}
                                    label={sectionLabel}
                                    canRemove={draft.experiences.length > 1}
                                    onMove={moveExperience}
                                    onRemove={removeExperience}
                                />
                            </div>
                            <article className={`${container} grid items-center gap-9 @4xl:grid-cols-2 @4xl:gap-16`}>
                                <EditableImage
                                    className={`relative aspect-[4/3] overflow-hidden rounded-xl shadow-[0_20px_55px_rgba(22,55,101,0.12)] ${
                                        reverse ? '@4xl:order-2' : ''
                                    }`}
                                    src={experience.image}
                                    alt={`${eyebrow} in ${location}`}
                                    label={`Section ${index + 1} image`}
                                    imgClassName="object-cover"
                                    invalid={invalidItem(`image-${index}`)}
                                    onChange={(url) => setExperience(index, 'image', url)}
                                />
                                <div className={reverse ? '@4xl:order-1' : ''}>
                                    <EditableText
                                        className="text-xs uppercase tracking-[0.28em] text-[#9b7512]"
                                        editClassName={lightEdit}
                                        value={experience.eyebrow}
                                        label={`Section ${index + 1} eyebrow`}
                                        placeholder="Eyebrow, e.g. See"
                                        invalid={invalidItem(`eyebrow-${index}`)}
                                        onChange={(value) => setExperience(index, 'eyebrow', value)}
                                    />
                                    <EditableText
                                        as="h3"
                                        className="mt-3 font-noto-serif text-2xl leading-tight text-royal @2xl:text-4xl"
                                        editClassName={lightEdit}
                                        value={experience.headline}
                                        label={`Section ${index + 1} title`}
                                        placeholder={`Title, e.g. Highlights of ${location}`}
                                        invalid={invalidItem(`headline-${index}`)}
                                        onChange={(value) => setExperience(index, 'headline', value)}
                                    />
                                    <EditableText
                                        multiline
                                        className="mt-1 max-w-xl text-base leading-8 text-ink/65"
                                        editClassName={lightEdit}
                                        value={experience.summary}
                                        label={`Section ${index + 1} subtitle`}
                                        placeholder="Subtitle: one line on what this section covers"
                                        invalid={invalidItem(`summary-${index}`)}
                                        onChange={(value) => setExperience(index, 'summary', value)}
                                    />
                                    <EditableText
                                        multiline
                                        className="mt-4 max-w-xl text-sm leading-7 text-ink/50"
                                        editClassName={lightEdit}
                                        value={experience.body}
                                        label={`Section ${index + 1} description`}
                                        placeholder="Description: a short story, local tip, or cultural detail"
                                        invalid={invalidItem(`body-${index}`)}
                                        onChange={(value) => setExperience(index, 'body', value)}
                                    />
                                    <span className="mt-7 block h-px w-16 bg-[#9b7512]/55" />
                                </div>
                            </article>
                        </section>
                    )
                })}

                <div className={`${container} flex justify-center pb-6`}>
                    <AddItemButton tone="light" label="Add image and text section" onClick={addExperience} />
                </div>

                <StoriesSection
                    titles={draft.storyTitles}
                    location={location}
                    testimonials={testimonials}
                    invalidItem={invalidItem}
                    onChange={(index, value) => setListItem('storyTitles', index, value)}
                />

                <section className="relative overflow-hidden bg-royal py-20 text-white @2xl:py-28">
                    <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:48px_48px]" />
                    <div className={`${container} relative grid gap-12 @4xl:grid-cols-[0.7fr_1.3fr] @4xl:gap-20`}>
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-gold">Travel Tips · Briefing</p>
                            <h2 className="mt-3 font-noto-serif text-4xl @2xl:text-5xl">Know before you go</h2>
                            <div className="mt-7 inline-flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/55">
                                <MapPin size={12} className="text-gold" />
                                Prepared for {location}
                            </div>
                        </div>
                        <ol className="grid gap-x-9 @2xl:grid-cols-2">
                            {draft.travelTips.map((tip, index) => {
                                const Icon = TIP_ICONS[index % TIP_ICONS.length]
                                return (
                                    <li key={index} className="flex gap-4 border-t border-gold/25 py-6">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/35 text-gold">
                                            <Icon size={16} strokeWidth={1.5} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[10px] uppercase tracking-[0.18em] text-gold/65">
                                                Brief 0{index + 1}
                                            </span>
                                            <EditableText
                                                multiline
                                                className="mt-2 text-sm leading-7 text-white/72"
                                                editClassName={darkEdit}
                                                value={tip}
                                                label={`Travel tip ${index + 1}`}
                                                placeholder="A practical tip for this destination"
                                                invalid={invalidItem(`tip-${index}`)}
                                                onChange={(value) => setListItem('travelTips', index, value)}
                                            />
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                    </div>
                </section>

                <ClientExperiences testimonials={testimonials} location={location} />

                {suggestedTours.length > 0 ? (
                    <section className="relative bg-oat py-20 @2xl:py-28">
                        <div className={`${container} relative`}>
                            <FixedBadge />
                            <p className="text-xs uppercase tracking-[0.28em] text-[#9b7512]">Continue exploring</p>
                            <h2 className="mt-3 font-noto-serif text-4xl text-royal @2xl:text-5xl">Suggested destinations</h2>
                            <div className="mt-9 grid gap-5 @3xl:grid-cols-3">
                                {suggestedTours.map((item) => (
                                    <div key={item.id} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-royal/10">
                                        <SafeImage
                                            src={item.coverImage}
                                            alt={item.title}
                                            className="absolute inset-0 h-full w-full"
                                            imgClassName={`object-cover ${cardCoverFocus(item.id)}`}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                        <div className="absolute inset-x-0 bottom-0 p-5">
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">{item.location}</p>
                                            <h3 className="mt-2 font-noto-serif text-2xl text-white">{item.title}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                ) : null}

                <section className="relative overflow-hidden bg-royal py-20 text-white @2xl:py-28">
                    <div aria-hidden className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:48px_48px]" />
                    <div className={`${container} relative text-center`}>
                        <FixedBadge tone="dark" />
                        <p className="text-xs uppercase tracking-[0.28em] text-gold">Where will your AVENture take you?</p>
                        <h2 className="mx-auto mt-4 max-w-4xl font-noto-serif text-4xl leading-tight @2xl:text-5xl @5xl:text-6xl">
                            Think beyond the visa. Dream about the destination.
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65">
                            Explore a destination. Discover the experience. Start imagining yourself there.
                        </p>
                    </div>
                </section>
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

function StoriesSection({
    titles,
    location,
    testimonials,
    invalidItem,
    onChange,
}: {
    titles: string[]
    location: string
    testimonials: Testimonial[]
    invalidItem: (key: string) => boolean
    onChange: (index: number, value: string) => void
}) {
    return (
        <section className="py-20 @2xl:py-28">
            <div className={container}>
                <p className="text-xs uppercase tracking-[0.28em] text-[#9b7512]">Must Try · Traveler Stories</p>
                <div className="mt-3 flex flex-col justify-between gap-5 @2xl:flex-row @2xl:items-end">
                    <h2 className="font-noto-serif text-4xl text-royal @2xl:text-5xl">Stories worth following</h2>
                    <span className="inline-flex items-center gap-2 text-sm text-[#9b7512]">
                        Read more stories <ArrowRight size={15} />
                    </span>
                </div>
                <div className="mt-9 grid gap-5 @3xl:grid-cols-3">
                    {titles.map((title, index) => {
                        const story = testimonials.length ? testimonials[index % testimonials.length] : null
                        const name = story?.name ?? 'AVENtures Traveler'
                        const initials = name
                            .split(/\s+/)
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        return (
                            <article
                                key={index}
                                className="rounded-xl border border-royal/10 bg-white/50 p-6 shadow-[0_12px_35px_rgba(22,55,101,0.06)]"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal font-noto-serif text-sm text-gold">
                                        {initials}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-royal">{name}</p>
                                        <p className="mt-0.5 text-xs text-ink/40">{story?.trip ?? location}</p>
                                    </div>
                                </div>
                                <EditableText
                                    as="h3"
                                    className="mt-6 font-noto-serif text-2xl text-royal"
                                    editClassName={lightEdit}
                                    value={title}
                                    label={`Story ${index + 1} title`}
                                    placeholder="A must-try moment"
                                    invalid={invalidItem(`story-${index}`)}
                                    onChange={(value) => onChange(index, value)}
                                />
                                <p
                                    className="mt-3 text-sm leading-7 text-ink/55"
                                    title="Quotes come from the site testimonials"
                                >
                                    <Lock size={11} strokeWidth={1.8} className="mr-1.5 inline text-ink/35" aria-hidden />
                                    “{story?.quote ?? `A memorable part of our journey through ${location}.`}”
                                </p>
                            </article>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

function ClientExperiences({ testimonials, location }: { testimonials: Testimonial[]; location: string }) {
    const [activeIndex, setActiveIndex] = useState(0)
    const stories = testimonials.length
        ? testimonials.slice(0, 5)
        : [
              {
                  id: 'fallback',
                  name: 'AVENtures Traveler',
                  trip: location,
                  quote: 'Every detail felt considered, while the journey still left room for us to experience the destination in our own way.',
                  rating: 5,
              },
          ]
    const activeStory = stories[activeIndex % stories.length]
    const move = (direction: -1 | 1) =>
        setActiveIndex((current) => (current + direction + stories.length) % stories.length)

    return (
        <section className="relative py-20 @2xl:py-28">
            <div className={`${container} relative`}>
                <FixedBadge />
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#9b7512]">Client Experiences · Feedback</p>
                    <h2 className="mt-3 font-noto-serif text-4xl text-royal @2xl:text-5xl">Journeys shared by travelers</h2>
                </div>
                <div className="relative mt-8 px-0 @2xl:px-16">
                    <button
                        type="button"
                        onClick={() => move(-1)}
                        aria-label="Previous client experience"
                        className="absolute left-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-royal/20 text-royal transition hover:border-[#9b7512] hover:bg-[#9b7512] hover:text-white @2xl:flex"
                    >
                        <ChevronLeft size={19} />
                    </button>
                    <div className="text-center">
                        <Quote className="mx-auto text-[#9b7512]/30" size={42} />
                        <blockquote className="mx-auto mt-5 max-w-4xl text-xl leading-relaxed text-royal/85 @2xl:text-2xl">
                            “{activeStory.quote}”
                        </blockquote>
                        <p className="mt-7 text-xs uppercase tracking-[0.2em] text-ink/45">
                            {activeStory.name} · {activeStory.trip}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => move(1)}
                        aria-label="Next client experience"
                        className="absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-royal/20 text-royal transition hover:border-[#9b7512] hover:bg-[#9b7512] hover:text-white @2xl:flex"
                    >
                        <ChevronRight size={19} />
                    </button>
                </div>
            </div>
        </section>
    )
}

function FixedBadge({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
    return (
        <span
            title="This copy is the same on every destination and is not editable here."
            className={`absolute right-6 top-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] @2xl:right-8 ${
                tone === 'dark'
                    ? 'border-white/15 bg-white/5 text-white/60'
                    : 'border-royal/15 bg-white/60 text-ink/50'
            }`}
        >
            <Lock size={10} strokeWidth={1.8} aria-hidden />
            Fixed
        </span>
    )
}
