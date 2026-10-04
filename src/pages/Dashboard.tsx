import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { cmsItems, cmsPath, type CmsItem } from '../config/navigation'

type Capability = {
    summary: string
    features: string[]
    available: boolean
}

const CAPABILITIES: Record<string, Capability> = {
    destinations: {
        summary: 'Signature journeys on the public Destinations page.',
        features: [
            'Search, filter, and sort in card or table view',
            'Drag cards to set the custom display order',
            'Create and edit destinations in the live page layout',
            'Edit cover, highlights, stories, and travel tips',
        ],
        available: true,
    },
    faqs: {
        summary: 'Questions on the public FAQ page and beside the homepage contact form.',
        features: [
            'Add, edit, search, and delete FAQs',
            'Create, rename, and reorder categories',
            'Choose the FAQs shown beside the contact form',
            'Preview the public FAQ page',
        ],
        available: true,
    },
    'visa-services': {
        summary: 'Visa service pages on the public site.',
        features: [],
        available: false,
    },
}

export default function Dashboard() {
    return (
        <div>
            <PageHeader
                eyebrow="Overview"
                title="Dashboard"
                description="What the admin site can do right now. More tools will appear here as they are built."
            />

            <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cmsItems.map((item) => (
                    <li key={item.path} className="flex">
                        <CapabilityCard item={item} capability={CAPABILITIES[item.path]} />
                    </li>
                ))}
            </ul>
        </div>
    )
}

function CapabilityCard({ item, capability }: { item: CmsItem; capability?: Capability }) {
    const Icon = item.icon
    const available = capability?.available ?? false

    const body = (
        <>
            <div className="flex items-start justify-between gap-3">
                <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        available ? 'bg-royal text-gold' : 'bg-royal/10 text-ink/45'
                    }`}
                >
                    <Icon size={18} strokeWidth={1.5} aria-hidden />
                </span>
                <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${
                        available ? 'bg-emerald-600/10 text-emerald-700' : 'bg-royal/[0.06] text-ink/55'
                    }`}
                >
                    {available ? 'Available' : 'Not built yet'}
                </span>
            </div>

            <h2 className={`mt-5 font-noto-serif text-2xl ${available ? 'text-ink' : 'text-ink/60'}`}>
                {item.label}
            </h2>
            {capability ? <p className="mt-2 text-sm leading-6 text-ink/60">{capability.summary}</p> : null}

            {capability && capability.features.length > 0 ? (
                <ul className="mt-4 space-y-1.5 text-sm text-ink/75">
                    {capability.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-deep" />
                            {feature}
                        </li>
                    ))}
                </ul>
            ) : null}

            {available ? (
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-royal transition group-hover:text-gold-deep">
                    Open {item.label}
                    <ArrowRight
                        size={15}
                        strokeWidth={1.5}
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                    />
                </span>
            ) : (
                <p className="mt-auto pt-6 text-sm text-ink/50">Coming soon.</p>
            )}
        </>
    )

    const cardClass = 'paper-card flex w-full flex-col rounded-[3px] p-5 sm:p-6'

    if (!available) return <div className={`${cardClass} opacity-80`}>{body}</div>

    return (
        <Link
            to={cmsPath(item)}
            className={`${cardClass} group transition hover:border-royal/30 hover:shadow-[0_18px_40px_rgba(22,55,101,0.1)]`}
        >
            {body}
        </Link>
    )
}
