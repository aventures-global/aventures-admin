import { useState } from 'react'
import { useUserActivity } from '../../hooks/useAdminUsers'
import { ghostActionClass } from '../../lib/formStyles'
import { ROLE_LABELS } from '../../lib/roles'
import type { ActivityEntry } from '../../services/adminUserService'
import type { AppUser, AppUserRole } from '../../services/userService'

type Person = ActivityEntry['actor']

function personLabel(person: Person, userId: string) {
    if (!person) return 'Someone'
    if (person.id === userId) return 'This user'
    return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.email || 'Someone'
}

function roleLabel(value: unknown) {
    return typeof value === 'string' && value in ROLE_LABELS ? ROLE_LABELS[value as AppUserRole].toLowerCase() : 'a new role'
}

function describe(entry: ActivityEntry, userId: string) {
    const actor = personLabel(entry.actor, userId)
    const subject = entry.subjectUser?.id === userId ? 'this user' : personLabel(entry.subjectUser, userId).toLowerCase()
    const meta = entry.metadata
    switch (entry.action) {
        case 'invitation.sent':
            return `${actor} invited ${subject} to become ${roleLabel(meta.role)}`
        case 'invitation.accepted':
            return `Accepted the invitation to become ${roleLabel(meta.role)}`
        case 'invitation.revoked':
            return `${actor} revoked the ${roleLabel(meta.role)} invitation for ${subject}`
        case 'role.changed':
            return `${actor} changed the role from ${roleLabel(meta.from)} to ${roleLabel(meta.to)}`
        case 'profile.updated':
            return `${actor} updated the profile of ${subject}`
        case 'business_settings.updated':
            return `${actor} updated the business settings`
        case 'role_permissions.updated':
            return `${actor} updated the role permissions`
        default:
            return `${actor}: ${entry.action}`
    }
}

export default function ActivityTimeline({ user }: { user: AppUser }) {
    const [page, setPage] = useState(1)
    const { data, isPending, isError, error } = useUserActivity(user.id, page)
    const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
    const isLastPage = page >= totalPages

    return (
        <section className="paper-card space-y-4 rounded-[3px] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Activity</p>
            {isPending ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-8 skeleton-shimmer rounded-[3px]" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-sm text-red-800">{error.message}</p>
            ) : (
                <>
                    <ol className="space-y-3 border-l border-royal/15 pl-4">
                        {data.items.map((entry) => (
                            <li key={entry.id} className="relative">
                                <span aria-hidden className="absolute top-1.5 -left-[1.3rem] h-2 w-2 rounded-full bg-gold-deep" />
                                <p className="text-sm text-ink">{describe(entry, user.id)}</p>
                                <p className="text-xs text-ink/45">{new Date(entry.createdAt).toLocaleString()}</p>
                            </li>
                        ))}
                        {isLastPage ? (
                            <li className="relative">
                                <span aria-hidden className="absolute top-1.5 -left-[1.3rem] h-2 w-2 rounded-full bg-royal/40" />
                                <p className="text-sm text-ink">Created an account</p>
                                <p className="text-xs text-ink/45">{new Date(user.createdAt).toLocaleString()}</p>
                            </li>
                        ) : null}
                    </ol>
                    {totalPages > 1 ? (
                        <div className="flex items-center justify-end gap-2 text-xs text-ink/50">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className={ghostActionClass}
                            >
                                Newer
                            </button>
                            <span className="tabular-nums">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={isLastPage}
                                onClick={() => setPage(page + 1)}
                                className={ghostActionClass}
                            >
                                Older
                            </button>
                        </div>
                    ) : null}
                </>
            )}
        </section>
    )
}
