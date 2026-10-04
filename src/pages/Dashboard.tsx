import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import WaveBadge from '../components/WaveBadge'
import {
    WAVE_LABELS,
    WAVE_ORDER,
    isReady,
    navGroups,
    pagePath,
    type NavGroup,
    type NavPage,
    type Wave,
} from '../config/navigation'

const WAVE_INTROS: Record<Wave, string> = {
    live: 'Tools you can use today.',
    next: 'The next screens to build: the core client workflow from the proposal and the content the public site already shows.',
    later: 'Modules planned after the core workflow is running.',
    suggested: 'Ideas beyond the proposal that would round out the system.',
}

type Entry = { group: NavGroup; page: NavPage }

const entriesByWave = WAVE_ORDER.map((wave) => ({
    wave,
    entries: navGroups.flatMap((group) =>
        group.pages.filter((page) => page.wave === wave).map((page): Entry => ({ group, page })),
    ),
})).filter(({ entries }) => entries.length > 0)

export default function Dashboard() {
    return (
        <div>
            <PageHeader
                eyebrow="Overview"
                title="Dashboard"
                description="Everything the admin site does today and every screen planned next. Each card opens its page; unbuilt pages explain what they will cover."
            />

            {entriesByWave.map(({ wave, entries }) => (
                <section key={wave} className="mt-10" aria-labelledby={`wave-${wave}`}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-royal/10 pb-3">
                        <h2 id={`wave-${wave}`} className="font-noto-serif text-2xl text-ink">
                            {WAVE_LABELS[wave]}
                        </h2>
                        <span className="text-sm text-ink/50">
                            {entries.length} {entries.length === 1 ? 'page' : 'pages'}
                        </span>
                        <p className="w-full text-sm text-ink/60">{WAVE_INTROS[wave]}</p>
                    </div>

                    <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {entries.map(({ group, page }) => (
                            <li key={pagePath(group, page)} className="flex">
                                <RoadmapCard group={group} page={page} />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    )
}

function RoadmapCard({ group, page }: Entry) {
    const Icon = page.icon
    const ready = isReady(page)

    return (
        <Link
            to={pagePath(group, page)}
            className={`paper-card group flex w-full flex-col rounded-[3px] p-5 transition hover:border-royal/30 hover:shadow-[0_18px_40px_rgba(22,55,101,0.1)] sm:p-6 ${
                ready ? '' : 'opacity-90'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        ready ? 'bg-royal text-gold' : 'bg-royal/10 text-ink/45'
                    }`}
                >
                    <Icon size={18} strokeWidth={1.5} aria-hidden />
                </span>
                <WaveBadge wave={page.wave} />
            </div>

            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.24em] text-royal/70">{group.label}</p>
            <h3 className={`mt-1 font-noto-serif text-2xl ${ready ? 'text-ink' : 'text-ink/70'}`}>{page.label}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">{page.summary}</p>

            {ready ? (
                <ul className="mt-4 space-y-1.5 text-sm text-ink/75">
                    {page.goals.map((goal) => (
                        <li key={goal} className="flex gap-2">
                            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-deep" />
                            {goal}
                        </li>
                    ))}
                </ul>
            ) : null}

            <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-royal transition group-hover:text-gold-deep">
                {ready ? `Open ${page.label}` : 'See the plan'}
                <ArrowRight
                    size={15}
                    strokeWidth={1.5}
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                />
            </span>
        </Link>
    )
}
