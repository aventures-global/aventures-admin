import { ChevronDown, ChevronsUpDown, Layers, LogOut } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { CMS_BASE, cmsItems, cmsPath, dashboardItem } from '../../config/navigation'
import { useAuth } from '../../lib/authContext'
import BrandWordmark from '../BrandWordmark'

function navLinkClass(active: boolean) {
    return `flex min-h-9 items-center gap-2.5 rounded-[3px] px-2.5 font-noto-serif text-[15px] tracking-wide transition-colors ${
        active ? 'bg-royal/[0.06] text-gold-deep' : 'text-ink/75 hover:bg-royal/[0.04] hover:text-[#9b7512]'
    }`
}

function initialsFromName(name?: string) {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'A'
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const location = useLocation()
    const cmsMenuId = useId()

    const inCms = location.pathname === CMS_BASE || location.pathname.startsWith(`${CMS_BASE}/`)
    const [cmsOpen, setCmsOpen] = useState(inCms)
    const [wasInCms, setWasInCms] = useState(inCms)
    if (inCms !== wasInCms) {
        setWasInCms(inCms)
        if (inCms) setCmsOpen(true)
    }

    const DashboardIcon = dashboardItem.icon

    return (
        <div className="flex h-full flex-col">
            <div className="px-4 pt-5 pb-5">
                <Link to="/" aria-label="AVENtures admin home" onClick={onNavigate}>
                    <BrandWordmark className="text-lg" />
                </Link>
            </div>

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

                <div className="mt-0.5">
                    <button
                        type="button"
                        aria-expanded={cmsOpen}
                        aria-controls={cmsMenuId}
                        onClick={() => setCmsOpen((value) => !value)}
                        className={`${navLinkClass(false)} w-full ${inCms ? 'text-gold-deep' : ''}`}
                    >
                        <Layers size={15} strokeWidth={1.5} aria-hidden />
                        <span className="flex-1 text-left">CMS</span>
                        <ChevronDown
                            size={14}
                            strokeWidth={1.5}
                            aria-hidden
                            className={`transition-transform duration-200 ${cmsOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <AnimatePresence initial={false}>
                        {cmsOpen ? (
                            <motion.ul
                                id={cmsMenuId}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-4 overflow-hidden border-l border-royal/15 pl-1.5"
                            >
                                {cmsItems.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <li key={item.path} className="py-px">
                                            <NavLink
                                                to={cmsPath(item)}
                                                className={({ isActive }) =>
                                                    `${navLinkClass(isActive)} text-sm`
                                                }
                                                onClick={onNavigate}
                                            >
                                                <Icon size={14} strokeWidth={1.5} aria-hidden />
                                                {item.label}
                                            </NavLink>
                                        </li>
                                    )
                                })}
                            </motion.ul>
                        ) : null}
                    </AnimatePresence>
                </div>
            </nav>

            <div className="border-t border-royal/10 p-2">
                <ProfileMenu />
            </div>
        </div>
    )
}

function ProfileMenu() {
    const { appUser, displayName, logout } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [signingOut, setSigningOut] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const menuId = useId()

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
                        className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[3px] border border-royal/15 bg-cream shadow-[0_18px_40px_rgba(22,55,101,0.14)]"
                    >
                        <div className="border-b border-royal/10 px-3 py-2.5">
                            <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                            {appUser?.email ? (
                                <p className="mt-0.5 truncate text-xs text-ink/55">{appUser.email}</p>
                            ) : null}
                        </div>
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-royal font-noto-serif text-[11px] tracking-wide text-cream">
                    {initialsFromName(displayName)}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-ink">{displayName}</span>
                    {appUser ? (
                        <span className="block truncate text-[11px] text-ink/55">{appUser.role}</span>
                    ) : null}
                </span>
                <ChevronsUpDown size={14} strokeWidth={1.5} aria-hidden className="text-ink/45" />
            </button>
        </div>
    )
}
