import { ArrowRight, ExternalLink, LayoutTemplate } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { useSitePageList } from '../../hooks/useSitePages'
import { publicSiteUrl } from '../../lib/publicSite'
import { SITE_PAGES } from '../../lib/sitePages'

const cardClass =
    'paper-card group flex h-full flex-col rounded-[3px] p-5 transition hover:border-royal/40 hover:shadow-[0_12px_30px_rgba(22,55,101,0.08)]'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function SitePages() {
    const results = useSitePageList()

    return (
        <div>
            <PageHeader
                eyebrow="CMS"
                title="Site pages"
                description="Copy for the homepage, About, Privacy Policy, and Terms & Conditions. Preview your changes in the editor; saving publishes them right away."
            />

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {SITE_PAGES.map((page, index) => {
                    const result = results[index]
                    return (
                        <li key={page.id} className="relative">
                            <Link to={page.id} className={cardClass}>
                                <LayoutTemplate size={18} strokeWidth={1.5} className="text-gold-deep" aria-hidden />
                                <span className="mt-3 font-noto-serif text-lg leading-snug text-royal">{page.label}</span>
                                <span className="mt-1 text-xs text-ink/50">{page.path}</span>
                                <span className="mt-3 text-sm text-ink/60">{page.description}</span>
                                <span className="mt-4 flex items-center justify-between gap-3 text-xs text-ink/50">
                                    <span>
                                        {result.isPending
                                            ? 'Loading…'
                                            : result.isError
                                              ? <span className="text-red-700">{result.error.message}</span>
                                              : `Updated ${dateFormat.format(new Date(result.data.updatedAt))}`}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-sm text-royal">
                                        Edit <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                                    </span>
                                </span>
                            </Link>
                            <a
                                href={publicSiteUrl(page.path)}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`View ${page.label} on the live site`}
                                title="View live page"
                                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-ink/40 transition hover:bg-royal/5 hover:text-royal"
                            >
                                <ExternalLink size={14} aria-hidden />
                            </a>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
