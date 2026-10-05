import { ArrowLeft, ArrowRight, ChevronDown, ExternalLink, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import EditableText from '../../components/cms/EditableText'
import EditorToolbar from '../../components/cms/EditorToolbar'
import FaqAccordion from '../../components/cms/faqs/preview/FaqAccordion'
import AboutVisa from '../../components/cms/visa/AboutVisa'
import ChecklistBox from '../../components/cms/visa/ChecklistBox'
import {
    EditorHint,
    EditorLoadState,
    EditorMessages,
    FixedBadge,
} from '../../components/cms/visa/VisaEditorParts'
import { usePublicFaqs } from '../../hooks/useFaqs'
import { useUnsavedGuard } from '../../hooks/useUnsavedGuard'
import { useUpdateVisaPage, useUpdateVisaService, useVisaCatalog } from '../../hooks/useVisaCatalog'
import { fieldClass, labelClass } from '../../lib/formStyles'
import { publicSiteUrl } from '../../lib/publicSite'
import { cleanService, isSame, serviceProblem, toServiceInput } from '../../lib/visaDraft'
import { resolveVisaFaqs, type FaqCategoryOption } from '../../lib/visaFaqs'
import { visaPagePath } from '../../lib/visaPaths'
import {
    lightEdit,
    visaContainer,
    visaPrimaryButton,
    visaQuietLink,
    visaSecondaryButton,
} from '../../lib/visaStyles'
import {
    ASK_VISA_TYPES,
    type VisaCatalog,
    type VisaId,
    type VisaPage,
    type VisaPageInput,
    type VisaServiceInput,
} from '../../types/visa'

type Draft = {
    page: VisaPageInput
    services: { id: VisaId; input: VisaServiceInput }[]
}

function toDraft(catalog: VisaCatalog, page: VisaPage): Draft {
    return {
        page: { title: page.title, description: page.description },
        services: page.visas.flatMap((id) => {
            const service = catalog.services.find((s) => s.id === id)
            return service ? [{ id, input: toServiceInput(service) }] : []
        }),
    }
}

function cleanDraft(draft: Draft): Draft {
    return {
        page: { title: draft.page.title.trim(), description: draft.page.description.trim() },
        services: draft.services.map(({ id, input }) => ({ id, input: cleanService(input) })),
    }
}

function draftProblems(draft: Draft): string[] {
    const clean = cleanDraft(draft)
    const problems: string[] = []
    if (!clean.page.title) problems.push('Add a page title.')
    if (!clean.page.description) problems.push('Add a search description in Page settings.')
    clean.services.forEach(({ input }, index) => {
        const problem = serviceProblem(input.title || `Visa ${index + 1}`, input)
        if (problem) problems.push(problem)
    })
    const anchors = clean.services.map(({ input }) => input.anchor)
    if (new Set(anchors).size !== anchors.length) problems.push('Each visa on this page needs a different section id.')
    return problems
}

export default function VisaPageEditor() {
    const { slug } = useParams<{ slug: string }>()
    const { data: catalog, isPending, error, refetch } = useVisaCatalog()

    if (isPending) return <EditorLoadState />
    if (error) return <EditorLoadState error={error} onRetry={() => void refetch()} />
    const page = catalog.pages.find((p) => p.slug === slug)
    if (!page) return <EditorLoadState error={new Error('This visa page does not exist.')} />
    return <Editor key={page.slug} catalog={catalog} page={page} />
}

function Editor({ catalog, page }: { catalog: VisaCatalog; page: VisaPage }) {
    const updatePage = useUpdateVisaPage()
    const updateService = useUpdateVisaService()
    const faqQuery = usePublicFaqs()
    const categories: FaqCategoryOption[] = faqQuery.data?.categories ?? []

    const [baseline, setBaseline] = useState(() => toDraft(catalog, page))
    const [draft, setDraft] = useState(baseline)
    const [mode, setMode] = useState<'edit' | 'preview'>('edit')
    const [problems, setProblems] = useState<string[]>([])
    const [saveError, setSaveError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)

    const dirty = !isSame(draft, baseline)
    const saving = updatePage.isPending || updateService.isPending
    const preview = mode === 'preview'
    const blocker = useUnsavedGuard(dirty)
    const shared = draft.services.length > 1

    useEffect(() => {
        if (!notice) return
        const timer = window.setTimeout(() => setNotice(null), 2500)
        return () => window.clearTimeout(timer)
    }, [notice])

    const change = (next: Draft) => {
        setNotice(null)
        setDraft(next)
        if (problems.length > 0) setProblems(draftProblems(next))
    }
    const setPage = (patch: Partial<VisaPageInput>) => change({ ...draft, page: { ...draft.page, ...patch } })
    const setService = (index: number, patch: Partial<VisaServiceInput>) =>
        change({
            ...draft,
            services: draft.services.map((s, i) => (i === index ? { ...s, input: { ...s.input, ...patch } } : s)),
        })

    const save = async () => {
        const found = draftProblems(draft)
        setProblems(found)
        setSaveError(null)
        if (found.length > 0) {
            setMode('edit')
            return
        }
        const clean = cleanDraft(draft)
        let latest: VisaCatalog | null = null
        try {
            if (!isSame(clean.page, baseline.page)) {
                latest = await updatePage.mutateAsync({ slug: page.slug, input: clean.page })
            }
            for (const [index, { id, input }] of clean.services.entries()) {
                if (!isSame(input, baseline.services[index]?.input)) {
                    latest = await updateService.mutateAsync({ id, input })
                }
            }
            const next = latest ? toDraft(latest, page) : clean
            setBaseline(next)
            setDraft(next)
            setNotice('Changes saved')
        } catch (err) {
            if (latest) setBaseline(toDraft(latest, page))
            setSaveError(err instanceof Error ? err.message : 'Could not save the visa page')
        }
    }

    const discard = () => {
        setDraft(baseline)
        setProblems([])
        setSaveError(null)
    }

    return (
        <div>
            <EditorToolbar
                backTo=".."
                backLabel="Visa pages"
                dirty={dirty}
                saving={saving}
                isNew={false}
                onSave={() => void save()}
                onDiscard={discard}
                mode={mode}
                onModeChange={setMode}
            />

            {preview ? null : (
                <PageSettings
                    open={settingsOpen}
                    onToggle={() => setSettingsOpen((open) => !open)}
                    draft={draft}
                    shared={shared}
                    livePath={visaPagePath(page.slug)}
                    onPageChange={setPage}
                    onServiceChange={setService}
                />
            )}

            <EditorMessages problems={problems} saveError={saveError} notice={notice} />

            <EditorHint preview={preview}>
                This is the live page layout. Click any text to edit it. FAQ answers come from the FAQs page, and
                sections marked “Fixed” are the same on every visa page.
            </EditorHint>

            <div className="@container luxury-paper overflow-hidden rounded-2xl border border-royal/10 font-poppins text-ink">
                <div className={`${visaContainer} pb-24 pt-14 @2xl:pt-16`}>
                    <div className="mx-auto max-w-4xl">
                        <span className={visaQuietLink}>
                            <ArrowLeft size={16} aria-hidden />
                            Back to the visa finder
                        </span>
                        <p className="mt-8 text-xs font-medium uppercase tracking-[0.3em] text-royal">Visa Services</p>
                        <EditableText
                            as="h1"
                            readOnly={preview}
                            className="mt-4 font-noto-serif text-4xl text-ink @2xl:text-5xl"
                            editClassName={lightEdit}
                            value={draft.page.title}
                            label="Page title"
                            placeholder="Page title"
                            invalid={!draft.page.title.trim()}
                            onChange={(title) => setPage({ title })}
                        />
                        {shared ? (
                            <nav aria-label="Visas on this page" className="mt-8 flex flex-wrap gap-2">
                                {draft.services.map(({ id, input }) => (
                                    <a
                                        key={id}
                                        href={`#visa-section-${id}`}
                                        onClick={(event) => {
                                            event.preventDefault()
                                            document
                                                .getElementById(`visa-section-${id}`)
                                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                        }}
                                        className="rounded-full border border-royal/20 px-4 py-1.5 text-sm text-ink/75 transition-colors hover:border-royal hover:text-royal"
                                    >
                                        {input.title || 'Untitled visa'}
                                    </a>
                                ))}
                            </nav>
                        ) : draft.services[0] ? (
                            <EditableText
                                readOnly={preview}
                                multiline
                                className="mt-6 max-w-2xl font-noto-serif text-lg italic text-royal @2xl:text-xl"
                                editClassName={lightEdit}
                                value={draft.services[0].input.description}
                                label="Visa description"
                                placeholder="One or two sentences about this visa"
                                invalid={!draft.services[0].input.description.trim()}
                                onChange={(description) => setService(0, { description })}
                            />
                        ) : null}

                        <div className={shared ? 'mt-12 space-y-20' : 'mt-12'}>
                            {draft.services.map(({ id, input }, index) => (
                                <VisaSection
                                    key={id}
                                    id={id}
                                    input={input}
                                    shared={shared}
                                    preview={preview}
                                    categories={categories}
                                    faqsLoading={faqQuery.isPending}
                                    faqsError={faqQuery.isError}
                                    onChange={(patch) => setService(index, patch)}
                                />
                            ))}
                        </div>

                        <footer className="mt-20 border-t border-royal/15 pt-8">
                            {preview ? null : (
                                <div className="mb-3">
                                    <FixedBadge />
                                </div>
                            )}
                            <p className="max-w-3xl text-xs leading-6 text-ink/50">
                                The information on this page is general guidance only and is not legal advice. The
                                appropriate visa category and requirements depend on your individual circumstances and
                                the specific purpose of your intended travel.
                            </p>
                            <span className={`${visaQuietLink} mt-5`}>
                                Explore all visa services
                                <ArrowRight size={16} aria-hidden />
                            </span>
                        </footer>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={blocker.state === 'blocked'}
                title="Leave without saving?"
                body="You have unsaved changes to this visa page. They will be lost if you leave now."
                confirmLabel="Leave page"
                cancelLabel="Keep editing"
                tone="danger"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            />
        </div>
    )
}

type VisaSectionProps = {
    id: VisaId
    input: VisaServiceInput
    shared: boolean
    preview: boolean
    categories: FaqCategoryOption[]
    faqsLoading: boolean
    faqsError: boolean
    onChange: (patch: Partial<VisaServiceInput>) => void
}

function VisaSection({ id, input, shared, preview, categories, faqsLoading, faqsError, onChange }: VisaSectionProps) {
    const resolved = resolveVisaFaqs(categories, input)
    const SubHeading = shared ? 'h3' : 'h2'
    const MinorHeading = shared ? 'h4' : 'h3'
    const visaName = input.title || 'This visa'

    return (
        <section id={`visa-section-${id}`} aria-label={input.title} className="scroll-mt-28">
            {shared ? (
                <header className="border-t border-royal/15 pt-10">
                    <EditableText
                        as="h2"
                        readOnly={preview}
                        className="font-noto-serif text-3xl text-ink @2xl:text-4xl"
                        editClassName={lightEdit}
                        value={input.title}
                        label="Visa title"
                        placeholder="Visa title"
                        invalid={!input.title.trim()}
                        onChange={(title) => onChange({ title })}
                    />
                    <EditableText
                        readOnly={preview}
                        multiline
                        className="mt-4 max-w-2xl font-noto-serif text-lg italic text-royal"
                        editClassName={lightEdit}
                        value={input.description}
                        label={`${visaName} description`}
                        placeholder="One or two sentences about this visa"
                        invalid={!input.description.trim()}
                        onChange={(description) => onChange({ description })}
                    />
                </header>
            ) : null}

            <AboutVisa
                visaName={visaName}
                links={input}
                resolved={resolved}
                categories={categories}
                faqsLoading={faqsLoading}
                faqsError={faqsError}
                preview={preview}
                subHeading={SubHeading}
                minorHeading={MinorHeading}
                onChange={onChange}
            />

            <ChecklistBox
                visaName={visaName}
                checklist={input.checklist}
                pdf={input.checklistPdf}
                preview={preview}
                subHeading={SubHeading}
                minorHeading={MinorHeading}
                onChange={(checklist) => onChange({ checklist })}
                onPdfChange={(checklistPdf) => onChange({ checklistPdf })}
            />

            {resolved.more.length > 0 ? (
                <div className="mt-12 max-w-3xl">
                    <SubHeading className="mb-4 flex flex-wrap items-center gap-3 font-noto-serif text-2xl text-ink">
                        More questions
                        {preview ? null : <FixedBadge title="These are the other questions in the FAQ category." />}
                    </SubHeading>
                    <FaqAccordion items={resolved.more} compact headingLevel={MinorHeading} />
                </div>
            ) : null}

            <div className="mt-12 flex flex-wrap items-center gap-3">
                <span className={visaPrimaryButton}>
                    Start Visa Assistance
                    <ArrowRight size={17} aria-hidden />
                </span>
                <span className={visaSecondaryButton}>Ask AVENtures</span>
                {preview ? null : <FixedBadge title="These buttons are the same on every visa page." />}
            </div>
        </section>
    )
}

function PageSettings({
    open,
    onToggle,
    draft,
    shared,
    livePath,
    onPageChange,
    onServiceChange,
}: {
    open: boolean
    onToggle: () => void
    draft: Draft
    shared: boolean
    livePath: string
    onPageChange: (patch: Partial<VisaPageInput>) => void
    onServiceChange: (index: number, patch: Partial<VisaServiceInput>) => void
}) {
    return (
        <div className="paper-card mb-5 rounded-[3px]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <button
                    type="button"
                    aria-expanded={open}
                    onClick={onToggle}
                    className="inline-flex items-center gap-2 text-sm text-ink/75 transition hover:text-royal"
                >
                    <Settings2 size={15} strokeWidth={1.6} aria-hidden />
                    Page settings
                    <span className="text-xs text-ink/45">Search description, links, and the Ask form</span>
                    <ChevronDown
                        size={14}
                        strokeWidth={1.6}
                        className={`transition-transform ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                    />
                </button>
                <a
                    href={publicSiteUrl(livePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-royal transition hover:text-gold-deep"
                >
                    View live page <ExternalLink size={12} aria-hidden />
                </a>
            </div>
            {open ? (
                <div className="space-y-4 border-t border-royal/10 px-4 py-4">
                    <div>
                        <label htmlFor="visa-page-seo" className={labelClass}>
                            Search description
                        </label>
                        <textarea
                            id="visa-page-seo"
                            rows={2}
                            value={draft.page.description}
                            placeholder="One or two sentences shown in search results and link previews"
                            onChange={(event) => onPageChange({ description: event.target.value })}
                            className={`${fieldClass} resize-y ${draft.page.description.trim() ? '' : 'border-red-600/70'}`}
                        />
                    </div>
                    {draft.services.map(({ id, input }, index) => (
                        <div key={id} className="grid gap-3 sm:grid-cols-3">
                            {shared ? (
                                <p className="text-sm font-medium text-royal sm:col-span-3">{input.title || 'Untitled visa'}</p>
                            ) : (
                                <div>
                                    <label htmlFor={`visa-${id}-title`} className={labelClass}>
                                        Visa name (finder results and service cards)
                                    </label>
                                    <input
                                        id={`visa-${id}-title`}
                                        value={input.title}
                                        onChange={(event) => onServiceChange(index, { title: event.target.value })}
                                        className={`${fieldClass} ${input.title.trim() ? '' : 'border-red-600/70'}`}
                                    />
                                </div>
                            )}
                            {shared ? (
                                <div>
                                    <label htmlFor={`visa-${id}-anchor`} className={labelClass}>
                                        Section link id
                                    </label>
                                    <div className="flex items-center gap-1 text-sm text-ink/50">
                                        #
                                        <input
                                            id={`visa-${id}-anchor`}
                                            value={input.anchor}
                                            onChange={(event) =>
                                                onServiceChange(index, { anchor: event.target.value.toLowerCase() })
                                            }
                                            className={fieldClass}
                                        />
                                    </div>
                                </div>
                            ) : null}
                            <div>
                                <label htmlFor={`visa-${id}-ask`} className={labelClass}>
                                    “Ask AVENtures” form preselects
                                </label>
                                <select
                                    id={`visa-${id}-ask`}
                                    value={input.askVisaType}
                                    onChange={(event) => onServiceChange(index, { askVisaType: event.target.value })}
                                    className={fieldClass}
                                >
                                    {ASK_VISA_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
