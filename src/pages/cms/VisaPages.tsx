import { ArrowRight, Compass, ExternalLink, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { useVisaCatalog } from '../../hooks/useVisaCatalog'
import { publicSiteUrl } from '../../lib/publicSite'
import { VISA_FINDER_PATH, visaPagePath } from '../../lib/visaPaths'

const cardClass =
    'paper-card group flex h-full flex-col rounded-[3px] p-5 transition hover:border-royal/40 hover:shadow-[0_12px_30px_rgba(22,55,101,0.08)]'

export default function VisaPages() {
    const { data, isPending, isError, error, refetch } = useVisaCatalog()

    return (
        <div>
            <PageHeader
                eyebrow="CMS"
                title="Visa pages"
                description="Open a page to edit it in its live layout, preview your changes, then save."
            />

            <div className="mt-6">
                {isPending ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-36 skeleton-paper rounded-[3px]" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
                        <p className="text-sm text-red-800">{error.message}</p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="mt-4 text-sm font-medium text-royal transition hover:text-gold-deep"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <>
                        <Link to="finder" className={`${cardClass} mb-8 sm:flex-row sm:items-center sm:gap-5`}>
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-royal text-gold">
                                <Compass size={20} strokeWidth={1.5} aria-hidden />
                            </span>
                            <span className="mt-3 min-w-0 flex-1 sm:mt-0">
                                <span className="block font-noto-serif text-xl text-royal">Visa finder</span>
                                <span className="mt-1 block text-sm text-ink/60">
                                    The three-question finder, its results, and the service cards at {VISA_FINDER_PATH}
                                </span>
                            </span>
                            <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-royal sm:mt-0">
                                Edit <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                            </span>
                        </Link>

                        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-ink/50">
                            Service pages
                        </h2>
                        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {data.pages.map((page) => {
                                const visas = page.visas.flatMap((id) => data.services.find((s) => s.id === id) ?? [])
                                return (
                                    <li key={page.slug} className="relative">
                                        <Link to={page.slug} className={cardClass}>
                                            <FileText size={18} strokeWidth={1.5} className="text-gold-deep" aria-hidden />
                                            <span className="mt-3 font-noto-serif text-lg leading-snug text-royal">
                                                {page.title}
                                            </span>
                                            <span className="mt-1 text-xs text-ink/50">{visaPagePath(page.slug)}</span>
                                            <span className="mt-3 flex flex-wrap gap-1.5">
                                                {visas.map((visa) => (
                                                    <span
                                                        key={visa.id}
                                                        className="rounded-full border border-royal/15 px-2 py-0.5 text-[11px] text-ink/60"
                                                    >
                                                        {visa.shortLabel}
                                                    </span>
                                                ))}
                                            </span>
                                        </Link>
                                        <a
                                            href={publicSiteUrl(visaPagePath(page.slug))}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`View ${page.title} on the live site`}
                                            title="View live page"
                                            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-ink/40 transition hover:bg-royal/5 hover:text-royal"
                                        >
                                            <ExternalLink size={14} aria-hidden />
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    </>
                )}
            </div>
        </div>
    )
}
