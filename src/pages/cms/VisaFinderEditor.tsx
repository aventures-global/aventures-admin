import { ChevronRight, ExternalLink } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import EditorToolbar from '../../components/cms/EditorToolbar'
import ExploreAllSection from '../../components/cms/visa/ExploreAllSection'
import FinderCard, { type FinderServiceView, type FinderStep } from '../../components/cms/visa/FinderCard'
import { EditorHint, EditorLoadState, EditorMessages } from '../../components/cms/visa/VisaEditorParts'
import { useUnsavedGuard } from '../../hooks/useUnsavedGuard'
import { useUpdateVisaFinder, useUpdateVisaService, useVisaCatalog } from '../../hooks/useVisaCatalog'
import { publicSiteUrl } from '../../lib/publicSite'
import { cleanFinder, finderHasBlank, isSame, toFinderInput } from '../../lib/visaDraft'
import { VISA_FINDER_PATH } from '../../lib/visaPaths'
import { visaContainer } from '../../lib/visaStyles'
import type { VisaCatalog, VisaFinder, VisaId } from '../../types/visa'

type ServiceLabels = Record<VisaId, { category: string; shortLabel: string }>

type Draft = {
    finder: VisaFinder
    services: ServiceLabels
}

function toDraft(catalog: VisaCatalog): Draft {
    return {
        finder: catalog.finder,
        services: Object.fromEntries(
            catalog.services.map((s) => [s.id, { category: s.category, shortLabel: s.shortLabel }]),
        ) as ServiceLabels,
    }
}

function cleanDraft(draft: Draft): Draft {
    return {
        finder: cleanFinder(draft.finder),
        services: Object.fromEntries(
            Object.entries(draft.services).map(([id, s]) => [
                id,
                { category: s.category.trim(), shortLabel: s.shortLabel.trim() },
            ]),
        ) as ServiceLabels,
    }
}

function draftProblems(draft: Draft): string[] {
    const clean = cleanDraft(draft)
    const problems: string[] = []
    if (finderHasBlank(clean.finder)) {
        problems.push('Fill in every question, answer, and note. Empty text is outlined in red; follow the answers to find it.')
    }
    if (Object.values(clean.services).some((s) => !s.category || !s.shortLabel)) {
        problems.push('Every service card needs a category, and every result button needs a short label.')
    }
    return problems
}

export default function VisaFinderEditor() {
    const { data: catalog, isPending, error, refetch } = useVisaCatalog()
    if (isPending) return <EditorLoadState />
    if (error) return <EditorLoadState error={error} onRetry={() => void refetch()} />
    return <Editor catalog={catalog} />
}

function Editor({ catalog }: { catalog: VisaCatalog }) {
    const updateFinder = useUpdateVisaFinder()
    const updateService = useUpdateVisaService()

    const [baseline, setBaseline] = useState(() => toDraft(catalog))
    const [draft, setDraft] = useState(baseline)
    const [mode, setMode] = useState<'edit' | 'preview'>('edit')
    const [history, setHistory] = useState<FinderStep[]>([{ kind: 'intro' }])
    const [problems, setProblems] = useState<string[]>([])
    const [saveError, setSaveError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    const step = history[history.length - 1]
    const preview = mode === 'preview'
    const dirty = !isSame(draft, baseline)
    const saving = updateFinder.isPending || updateService.isPending
    const blocker = useUnsavedGuard(dirty)

    const services: FinderServiceView[] = useMemo(
        () =>
            catalog.services.map((s) => ({
                id: s.id,
                title: s.title,
                description: s.description,
                ...draft.services[s.id],
            })),
        [catalog.services, draft.services],
    )

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
    const setServiceLabel = (visa: VisaId, patch: Partial<ServiceLabels[VisaId]>) =>
        change({ ...draft, services: { ...draft.services, [visa]: { ...draft.services[visa], ...patch } } })

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
            const input = toFinderInput(clean.finder)
            if (!isSame(input, toFinderInput(baseline.finder))) latest = await updateFinder.mutateAsync(input)
            for (const [id, labels] of Object.entries(clean.services) as [VisaId, ServiceLabels[VisaId]][]) {
                if (!isSame(labels, baseline.services[id])) {
                    latest = await updateService.mutateAsync({ id, input: labels })
                }
            }
            const next = latest ? toDraft(latest) : clean
            setBaseline(next)
            setDraft(next)
            setNotice('Changes saved')
        } catch (err) {
            if (latest) setBaseline(toDraft(latest))
            setSaveError(err instanceof Error ? err.message : 'Could not save the visa finder')
        }
    }

    const discard = () => {
        setDraft(baseline)
        setProblems([])
        setSaveError(null)
    }

    const stepLabel = (item: FinderStep): string => {
        switch (item.kind) {
            case 'intro':
                return 'Start'
            case 'purpose':
                return 'Question 1'
            case 'role':
                return draft.finder.purpose.options.find((o) => o.path === item.path)?.label || 'Question 2'
            case 'readiness':
                return services.find((s) => s.id === item.visa)?.title || 'Question 3'
            case 'result':
                return (
                    draft.finder.readiness[item.visa]?.options.find((o) => o.id === item.readiness)?.label || 'Result'
                )
            default:
                return 'Not sure'
        }
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

            <EditorMessages problems={problems} saveError={saveError} notice={notice} />

            <EditorHint preview={preview}>
                This is the live finder. Click any text to edit it, and use the arrow on an answer to follow it to the
                next question or result.
            </EditorHint>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <nav aria-label="Finder step" className="flex flex-wrap items-center gap-1 text-xs text-ink/55">
                    {history.map((item, index) => {
                        const last = index === history.length - 1
                        return (
                            <span key={index} className="inline-flex items-center gap-1">
                                {index > 0 ? <ChevronRight size={12} className="text-ink/30" aria-hidden /> : null}
                                {last ? (
                                    <span aria-current="step" className="font-medium text-royal">
                                        {stepLabel(item)}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setHistory(history.slice(0, index + 1))}
                                        className="max-w-48 truncate transition hover:text-royal"
                                    >
                                        {stepLabel(item)}
                                    </button>
                                )}
                            </span>
                        )
                    })}
                </nav>
                <a
                    href={publicSiteUrl(VISA_FINDER_PATH)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-royal transition hover:text-gold-deep"
                >
                    View live finder <ExternalLink size={12} aria-hidden />
                </a>
            </div>

            <div className="@container luxury-paper overflow-hidden rounded-2xl border border-royal/10 font-poppins text-ink">
                <section className="relative flex min-h-[490px] items-center bg-oat py-20">
                    <img
                        src={publicSiteUrl('/assets/images/visa-services.jpg?v=1')}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,24,49,0.23),rgba(10,35,70,0.32),rgba(5,18,38,0.45))]" />
                    <div className={`${visaContainer} relative z-10`}>
                        <FinderCard
                            finder={draft.finder}
                            services={services}
                            step={step}
                            preview={preview}
                            onGo={(next) => setHistory((prev) => [...prev, next])}
                            onBack={() => setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))}
                            onStartOver={() => setHistory([{ kind: 'intro' }, { kind: 'purpose' }])}
                            onFinderChange={(finder) => change({ ...draft, finder })}
                            onShortLabelChange={(visa, shortLabel) => setServiceLabel(visa, { shortLabel })}
                        />
                    </div>
                </section>

                <section className="relative bg-white pb-20 pt-20 @2xl:pb-24 @2xl:pt-28">
                    <div className={visaContainer}>
                        <ExploreAllSection
                            finder={draft.finder}
                            services={services}
                            recommended={step.kind === 'result' ? step.visa : null}
                            preview={preview}
                            onCategoryChange={(visa, category) => setServiceLabel(visa, { category })}
                            onFinderChange={(finder) => change({ ...draft, finder })}
                        />
                    </div>
                </section>
            </div>

            <ConfirmDialog
                open={blocker.state === 'blocked'}
                title="Leave without saving?"
                body="You have unsaved changes to the visa finder. They will be lost if you leave now."
                confirmLabel="Leave page"
                cancelLabel="Keep editing"
                tone="danger"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            />
        </div>
    )
}
