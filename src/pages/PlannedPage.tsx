import { ArrowLeft, Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminPanel } from '../components/admin'
import PageHeader from '../components/PageHeader'
import WaveBadge from '../components/WaveBadge'
import type { NavGroup, NavPage } from '../config/navigation'

const WAVE_NOTES = {
    live: '',
    next: 'This is one of the next screens to build.',
    later: 'This screen is planned for a later phase.',
    suggested: 'This screen is a suggestion beyond the current proposal.',
}

export default function PlannedPage({ group, page }: { group: NavGroup; page: NavPage }) {
    const Icon = page.icon

    return (
        <div>
            <PageHeader eyebrow={group.label} title={page.label} description={page.summary} />

            <AdminPanel className="mt-6 max-w-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-royal/10 text-ink/55">
                        <Icon size={16} strokeWidth={1.5} aria-hidden />
                    </span>
                    <WaveBadge wave={page.wave} />
                </div>

                <div className="mt-4 flex items-center gap-2 text-ink">
                    <Construction size={16} strokeWidth={1.5} aria-hidden className="text-ink/45" />
                    <h2 className="text-base font-semibold">Not ready yet</h2>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-ink/55">{WAVE_NOTES[page.wave]}</p>

                <h3 className="mt-5 text-xs font-medium text-ink/45">What it will cover</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
                    {page.goals.map((goal) => (
                        <li key={goal} className="flex gap-2">
                            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-royal" />
                            {goal}
                        </li>
                    ))}
                </ul>

                <Link
                    to="/roadmap"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-royal hover:underline"
                >
                    <ArrowLeft size={15} strokeWidth={1.5} aria-hidden />
                    Back to the roadmap
                </Link>
            </AdminPanel>
        </div>
    )
}
