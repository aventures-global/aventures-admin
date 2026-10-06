import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import EditorToolbar from '../../components/cms/EditorToolbar'
import AboutForm from '../../components/cms/sitePages/AboutForm'
import HomeForm from '../../components/cms/sitePages/HomeForm'
import LegalForm from '../../components/cms/sitePages/LegalForm'
import { AboutPreview, HomePreview, LegalPreview } from '../../components/cms/sitePages/SitePagePreview'
import { EditorHint, EditorMessages } from '../../components/cms/visa/VisaEditorParts'
import { useSaveSitePage, useSitePage } from '../../hooks/useSitePages'
import { useUnsavedGuard } from '../../hooks/useUnsavedGuard'
import { publicSiteUrl } from '../../lib/publicSite'
import { cleanContent, contentProblems, isSitePageId, sitePageMeta } from '../../lib/sitePages'
import type {
    AboutPageContent,
    HomePageContent,
    LegalPageContent,
    SitePage,
    SitePageContentMap,
    SitePageId,
} from '../../types/sitePages'

const PRIVACY_NOTES = {
    website:
        'When Google Analytics is turned on, the site adds an “Analytics” bullet under this section automatically. Keep the anchor as “website” for it to appear here.',
    sharing:
        'When Google Analytics is turned on, the site adds a Google Analytics bullet under this section automatically. Keep the anchor as “sharing” for it to appear here.',
}

function LoadState({ error, onRetry }: { error?: Error | null; onRetry?: () => void }) {
    if (!error) {
        return (
            <div className="space-y-4">
                <div className="h-12 skeleton-paper rounded-[3px]" />
                <div className="h-[32rem] skeleton-paper rounded-[3px]" />
            </div>
        )
    }
    return (
        <div className="rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
            <p className="text-sm text-red-800">{error.message}</p>
            <div className="mt-4 flex justify-center gap-5 text-sm font-medium">
                {onRetry ? (
                    <button type="button" onClick={onRetry} className="text-royal transition hover:text-gold-deep">
                        Try again
                    </button>
                ) : null}
                <Link to=".." relative="path" className="text-royal transition hover:text-gold-deep">
                    Back to site pages
                </Link>
            </div>
        </div>
    )
}

export default function SitePageEditor() {
    const { id } = useParams<{ id: string }>()
    if (!isSitePageId(id)) return <LoadState error={new Error('This page does not exist.')} />
    return <LoadedEditor key={id} id={id} />
}

function LoadedEditor({ id }: { id: SitePageId }) {
    const { data, isPending, error, refetch } = useSitePage(id)
    if (isPending) return <LoadState />
    if (error) return <LoadState error={error} onRetry={() => void refetch()} />
    return <Editor id={id} page={data} />
}

function Editor<Id extends SitePageId>({ id, page }: { id: Id; page: SitePage<Id> }) {
    const meta = sitePageMeta(id)
    const savePage = useSaveSitePage(id)
    const [baseline, setBaseline] = useState(page.content)
    const [draft, setDraft] = useState(page.content)
    const [mode, setMode] = useState<'edit' | 'preview'>('edit')
    const [problems, setProblems] = useState<string[]>([])
    const [saveError, setSaveError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
    const blocker = useUnsavedGuard(dirty)
    const preview = mode === 'preview'
    const showErrors = problems.length > 0

    useEffect(() => {
        if (!notice) return
        const timer = window.setTimeout(() => setNotice(null), 2500)
        return () => window.clearTimeout(timer)
    }, [notice])

    const change = (next: SitePageContentMap[Id]) => {
        setNotice(null)
        setDraft(next)
        if (problems.length > 0) setProblems(contentProblems(id, next))
    }

    const save = async () => {
        const found = contentProblems(id, draft)
        setProblems(found)
        setSaveError(null)
        if (found.length > 0) {
            setMode('edit')
            return
        }
        try {
            const saved = await savePage.mutateAsync(cleanContent(id, draft))
            setBaseline(saved.content)
            setDraft(saved.content)
            setNotice('Changes saved and published')
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Could not save the page')
        }
    }

    const discard = () => {
        setDraft(baseline)
        setProblems([])
        setSaveError(null)
    }

    const onChange = change as (next: unknown) => void

    return (
        <div>
            <EditorToolbar
                backTo=".."
                backLabel="Site pages"
                dirty={dirty}
                saving={savePage.isPending}
                isNew={false}
                onSave={() => void save()}
                onDiscard={discard}
                mode={mode}
                onModeChange={setMode}
            />

            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="font-noto-serif text-2xl text-ink">{meta.label}</h1>
                <a
                    href={publicSiteUrl(meta.path)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-royal transition hover:text-gold-deep"
                >
                    View live page <ExternalLink size={13} aria-hidden />
                </a>
            </div>

            <EditorMessages problems={problems} saveError={saveError} notice={notice} />

            <EditorHint preview={preview}>
                Edit the copy below, switch to Preview to check it, then save. Saving publishes the changes right away.
            </EditorHint>

            {preview ? (
                id === 'home' ? (
                    <HomePreview content={draft as HomePageContent} />
                ) : id === 'about' ? (
                    <AboutPreview content={draft as AboutPageContent} />
                ) : (
                    <LegalPreview title={meta.label} content={draft as LegalPageContent} />
                )
            ) : id === 'home' ? (
                <HomeForm value={draft as HomePageContent} onChange={onChange} showErrors={showErrors} />
            ) : id === 'about' ? (
                <AboutForm value={draft as AboutPageContent} onChange={onChange} showErrors={showErrors} />
            ) : (
                <LegalForm
                    value={draft as LegalPageContent}
                    onChange={onChange}
                    showErrors={showErrors}
                    fixedNotes={id === 'privacy' ? PRIVACY_NOTES : undefined}
                />
            )}

            <ConfirmDialog
                open={blocker.state === 'blocked'}
                title="Leave without saving?"
                body={`You have unsaved changes to the ${meta.label} page. They will be lost if you leave now.`}
                confirmLabel="Leave page"
                cancelLabel="Keep editing"
                tone="danger"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            />
        </div>
    )
}
