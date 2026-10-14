import { ArrowLeft } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { settingsTabPath, settingsTabs } from '../../config/settings'
import { useAuth } from '../../lib/authContext'

export default function SettingsNav({
    onNavigate,
    linkClass,
}: {
    onNavigate?: () => void
    linkClass: (active: boolean) => string
}) {
    const { can } = useAuth()

    return (
        <>
            <Link
                to="/"
                onClick={onNavigate}
                className="mb-3 inline-flex items-center gap-1.5 px-2.5 text-sm text-ink/60 transition hover:text-royal"
            >
                <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
                Back to dashboard
            </Link>
            <p className="px-2.5 pb-2 text-xs font-medium uppercase tracking-[0.3em] text-royal">Settings</p>
            <ul>
                {settingsTabs
                    .filter((tab) => !tab.permission || can(tab.permission))
                    .map((tab) => {
                        const Icon = tab.icon
                        return (
                            <li key={tab.path} className="py-px">
                                <NavLink
                                    to={settingsTabPath(tab)}
                                    className={({ isActive }) => `${linkClass(isActive)} text-sm`}
                                    onClick={onNavigate}
                                >
                                    <Icon size={14} strokeWidth={1.5} aria-hidden />
                                    <span className="truncate">{tab.label}</span>
                                </NavLink>
                            </li>
                        )
                    })}
            </ul>
        </>
    )
}
