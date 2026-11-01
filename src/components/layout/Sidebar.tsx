import { ChevronDown, ChevronsUpDown, LogOut, Map, Settings } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { dashboardItem, isReady, navGroups, pagePath, type NavGroup } from '../../config/navigation'
import { SETTINGS_BASE } from '../../config/settings'
import { useAuth } from '../../lib/authContext'
import { ROLE_LABELS } from '../../lib/roles'
import BrandWordmark from '../BrandWordmark'
import SettingsNav from './SettingsNav'

function navLinkClass(active: boolean) {
    return `flex min-h-9 items-center gap-2.5 rounded-[3px] px-2.5 text-sm transition-colors ${
        active
            ? 'bg-royal/[0.08] font-medium text-royal'
            : 'text-ink/70 hover:bg-royal/[0.04] hover:text-ink'
    }`
}

function initialsFromName(name?: string) {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'A'
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const DashboardIcon = dashboardItem.icon
    const { pathname } = useLocation()
    const inSettings = pathname === SETTINGS_BASE || pathname.startsWith(`${SETTINGS_BASE}/`)

    return (
        <div className="flex h-full flex-col">
            <div className="px-4 pt-4 pb-4">
                <Link to="/" aria-label="AVENtures admin home" onClick={onNavigate}>
                    <BrandWordmark className="text-lg" />
                </Link>
            </div>

            {inSettings ? (
                <nav aria-label="Settings" className="no-scrollbar flex-1 overflow-y-auto px-2">
                    <SettingsNav onNavigate={onNavigate} linkClass={navLinkClass} />
                </nav>
            ) : (
                <nav aria-label="Main" className="no-scrollbar flex-1 overflow-y-auto px-2">
                    <NavLink
                        to={dashboardItem.to}
                        end
                        className={({ isActive }) => navLinkClass(isActive)}
                        onClick={onNavigate}
                    >
                        <DashboardIcon size={15} strokeWidth={1.5} aria-hidden />
                        {dashboardItem.label}
                    </NavLink>

                    {navGroups.map((group) => (
                        <SidebarGroup key={group.id} group={group} onNavigate={onNavigate} />
                    ))}

                    <NavLink
                        to="/roadmap"
                        className={({ isActive }) => `mt-3 ${navLinkClass(isActive)}`}
                        onClick={onNavigate}
                    >
                        <Map size={15} strokeWidth={1.5} aria-hidden />
                        Roadmap
                    </NavLink>
                </nav>
            )}

            <div className="border-t border-admin-border p-2">
                <ProfileMenu onNavigate={onNavigate} />
            </div>
        </div>
    )
}

function SidebarGroup({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
    const location = useLocation()
    const menuId = useId()
    const GroupIcon = group.icon
    const livePages = useMemo(() => group.pages.filter(isReady), [group.pages])

    const inGroup = location.pathname === group.base || location.pathname.startsWith(`${group.base}/`)
    const [open, setOpen] = useState(inGroup)
    const [wasInGroup, setWasInGroup] = useState(inGroup)
    if (inGroup !== wasInGroup) {
        setWasInGroup(inGroup)
        if (inGroup) setOpen(true)
    }

    if (livePages.length === 0) return null

    return (
        <div className="mt-0.5">
            <button
                type="button"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((value) => !value)}
                className={`${navLinkClass(false)} w-full ${inGroup ? 'font-medium text-royal' : ''}`}
            >
                <GroupIcon size={15} strokeWidth={1.5} aria-hidden />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    aria-hidden
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence initial={false}>
                {open ? (
                    <motion.ul
                        id={menuId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 overflow-hidden border-l border-admin-border pl-1.5"
                    >
                        {livePages.map((page) => {
                            const Icon = page.icon
                            return (
                                <li key={page.path} className="py-px">
                                    <NavLink
                                        to={pagePath(group, page)}
                                        className={({ isActive }) => `${navLinkClass(isActive)} text-sm`}
                                        onClick={onNavigate}
                                    >
                                        <Icon size={14} strokeWidth={1.5} aria-hidden />
                                        <span className="truncate">{page.label}</span>
                                    </NavLink>
                                </li>
                            )
                        })}
                    </motion.ul>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

function ProfileMenu({ onNavigate }: { onNavigate?: () => void }) {
    const { appUser, displayName, logout } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [signingOut, setSigningOut] = useState(false)
    const [photoFailed, setPhotoFailed] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const menuId = useId()
    const photoUrl = appUser?.profilePicture

    useEffect(() => {
        setPhotoFailed(false)
    }, [photoUrl])

    useEffect(() => {
        if (!open) return
        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    async function handleLogout() {
        setSigningOut(true)
        try {
            await logout()
            navigate('/login', { replace: true })
        } finally {
            setSigningOut(false)
        }
    }

    return (
        <div ref={rootRef} className="relative">
            <AnimatePresence>
                {open ? (
                    <motion.div
                        id={menuId}
                        role="menu"
                        aria-label="Account"
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[3px] border border-admin-border bg-admin-surface shadow-sm"
                    >
                        <div className="border-b border-admin-border px-3 py-2.5">
                            <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                            {appUser?.email ? (
                                <p className="mt-0.5 truncate text-xs text-ink/55">{appUser.email}</p>
                            ) : null}
                        </div>
                        <Link
                            to={SETTINGS_BASE}
                            role="menuitem"
                            onClick={() => {
                                setOpen(false)
                                onNavigate?.()
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink/80 transition hover:bg-royal/5 hover:text-royal"
                        >
                            <Settings size={15} strokeWidth={1.5} aria-hidden />
                            Settings
                        </Link>
                        <button
                            type="button"
                            role="menuitem"
                            disabled={signingOut}
                            onClick={() => {
                                void handleLogout()
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink/80 transition hover:bg-royal/5 hover:text-royal disabled:opacity-60"
                        >
                            <LogOut size={15} strokeWidth={1.5} aria-hidden />
                            {signingOut ? 'Signing out…' : 'Log out'}
                        </button>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((value) => !value)}
                className={`flex w-full items-center gap-2.5 rounded-[3px] px-2 py-1.5 text-left transition hover:bg-royal/5 ${
                    open ? 'bg-royal/5' : ''
                }`}
            >
                {photoUrl && !photoFailed ? (
                    <img
                        src={photoUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full border border-admin-border object-cover"
                        onError={() => setPhotoFailed(true)}
                    />
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-royal text-[11px] font-medium tracking-wide text-white">
                        {initialsFromName(displayName)}
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-ink">{displayName}</span>
                    {appUser ? (
                        <span className="block truncate text-[11px] text-ink/55">{ROLE_LABELS[appUser.role]}</span>
                    ) : null}
                </span>
                <ChevronsUpDown size={14} strokeWidth={1.5} aria-hidden className="text-ink/45" />
            </button>
        </div>
    )
}
