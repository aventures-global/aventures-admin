import { Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useAdminUsers, useCreateInvitation } from '../../hooks/useAdminUsers'
import { fieldClass, ghostActionClass, labelClass, primaryActionClass, selectClass } from '../../lib/formStyles'
import { ROLE_LABELS, isPromotion } from '../../lib/roles'
import type { InvitationResult, InviteRole } from '../../services/adminUserService'
import type { AppUser } from '../../services/userService'
import RoleBadge from './RoleBadge'

const INVITE_ROLES: { role: InviteRole; description: string }[] = [
    { role: 'STAFF', description: 'Can sign in to the admin site with staff permissions.' },
    { role: 'ADMIN', description: 'Can sign in to the admin site with admin permissions.' },
]

function userName(user: AppUser) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unnamed user'
}

type InviteDialogProps = {
    open: boolean
    onClose: () => void
    /** Skips the search step when inviting a known user. */
    user?: AppUser
}

export default function InviteDialog({ open, onClose, user }: InviteDialogProps) {
    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-royal/30 p-4 font-poppins backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invite-dialog-title"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-lg rounded-[3px] border border-royal/15 bg-cream p-5 shadow-[0_24px_60px_rgba(22,55,101,0.2)]"
                    >
                        <InviteFlow initialUser={user} onClose={onClose} />
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}

function InviteFlow({ initialUser, onClose }: { initialUser?: AppUser; onClose: () => void }) {
    const [selected, setSelected] = useState<AppUser | null>(initialUser ?? null)
    const [role, setRole] = useState<InviteRole | null>(null)
    const [result, setResult] = useState<InvitationResult | null>(null)
    const invite = useCreateInvitation()

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !invite.isPending) onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [invite.isPending, onClose])

    const roleOptions = selected ? INVITE_ROLES.filter((option) => isPromotion(selected.role, option.role)) : []

    const send = () => {
        if (!selected || !role) return
        invite.mutate({ userId: selected.id, role }, { onSuccess: setResult })
    }

    if (result) {
        return (
            <div>
                <h2 id="invite-dialog-title" className="font-noto-serif text-xl text-ink">
                    Invitation {result.emailSent ? 'sent' : 'created'}
                </h2>
                {result.emailSent ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink/65">
                        {result.invitation.user.email} will become {ROLE_LABELS[result.invitation.role].toLowerCase()}{' '}
                        after accepting the emailed link. The link expires in 7 days.
                    </p>
                ) : (
                    <>
                        <p className="mt-2 text-sm leading-relaxed text-ink/65">
                            The email could not be sent. Share this link with {result.invitation.user.email} directly. It
                            expires in 7 days.
                        </p>
                        <input
                            readOnly
                            value={result.acceptUrl ?? ''}
                            onFocus={(event) => event.target.select()}
                            aria-label="Invitation link"
                            className={`${fieldClass} mt-3 font-mono text-xs`}
                        />
                    </>
                )}
                <div className="mt-5 flex justify-end">
                    <button type="button" onClick={onClose} className={primaryActionClass}>
                        Done
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <h2 id="invite-dialog-title" className="font-noto-serif text-xl text-ink">
                Invite to the team
            </h2>
            <p className="mt-1 text-sm text-ink/60">
                The person gets an email and becomes staff or admin only after accepting.
            </p>

            {selected ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[3px] border border-royal/15 px-3 py-2.5">
                    <div className="min-w-0">
                        <p className="truncate text-sm text-ink">{userName(selected)}</p>
                        <p className="truncate text-xs text-ink/50">{selected.email ?? 'No email'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <RoleBadge role={selected.role} />
                        {initialUser ? null : (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelected(null)
                                    setRole(null)
                                }}
                                className="text-xs text-royal transition hover:text-gold-deep"
                            >
                                Change
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <UserSearch onPick={setSelected} />
            )}

            {selected ? (
                <div className="mt-4 space-y-2">
                    <p className={labelClass}>Invite as</p>
                    {roleOptions.length === 0 ? (
                        <p className="text-sm text-ink/60">This account already has the highest role you can invite to.</p>
                    ) : (
                        roleOptions.map((option) => (
                            <button
                                key={option.role}
                                type="button"
                                onClick={() => setRole(option.role)}
                                className={`flex w-full flex-col rounded-[3px] border px-3 py-2.5 text-left transition ${
                                    role === option.role ? 'border-royal bg-royal/[0.04]' : 'border-royal/15 hover:border-royal/50'
                                }`}
                            >
                                <span className="text-sm text-ink">{ROLE_LABELS[option.role]}</span>
                                <span className="text-xs text-ink/55">{option.description}</span>
                            </button>
                        ))
                    )}
                    {!selected.email ? (
                        <p className="text-xs text-red-800">This account has no email address, so it cannot be invited.</p>
                    ) : null}
                </div>
            ) : null}

            {invite.error ? <p className="mt-3 text-sm text-red-800">{invite.error.message}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={onClose} disabled={invite.isPending} className={ghostActionClass}>
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={send}
                    disabled={!selected?.email || !role || invite.isPending}
                    className={primaryActionClass}
                >
                    {invite.isPending ? 'Sending…' : 'Send invitation'}
                </button>
            </div>
        </div>
    )
}

function UserSearch({ onPick }: { onPick: (user: AppUser) => void }) {
    const [query, setQuery] = useState('')
    const [debounced, setDebounced] = useState('')

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(query.trim()), 300)
        return () => window.clearTimeout(timer)
    }, [query])

    const { data, isFetching } = useAdminUsers(
        { q: debounced, scope: 'all', role: 'all', sort: 'createdAt', dir: 'desc', page: 1, limit: 8 },
        { enabled: debounced.length >= 2 },
    )

    return (
        <div className="mt-4">
            <div className="relative">
                <Search
                    size={15}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-deep"
                    aria-hidden
                />
                <input
                    type="search"
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search any account by email, name, or phone…"
                    aria-label="Search accounts"
                    autoComplete="off"
                    className={`${selectClass} w-full pl-9 placeholder:text-ink/40`}
                />
            </div>
            <ul className={`mt-2 max-h-64 overflow-y-auto transition-opacity ${isFetching ? 'opacity-70' : ''}`}>
                {debounced.length < 2 ? (
                    <li className="px-1 py-2 text-xs text-ink/50">
                        Type at least two characters. People appear after they sign in to the website once.
                    </li>
                ) : data && data.items.length === 0 ? (
                    <li className="px-1 py-2 text-xs text-ink/50">No accounts match.</li>
                ) : (
                    data?.items.map((user) => (
                        <li key={user.id}>
                            <button
                                type="button"
                                onClick={() => onPick(user)}
                                className="flex w-full items-center justify-between gap-3 rounded-[3px] px-2 py-2 text-left transition hover:bg-royal/[0.04]"
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-sm text-ink">{userName(user)}</span>
                                    <span className="block truncate text-xs text-ink/50">{user.email ?? 'No email'}</span>
                                </span>
                                <RoleBadge role={user.role} />
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    )
}
