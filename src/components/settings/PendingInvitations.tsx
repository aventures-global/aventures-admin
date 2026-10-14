import { useState } from 'react'
import { useInvitations, useRevokeInvitation } from '../../hooks/useAdminUsers'
import { ROLE_LABELS } from '../../lib/roles'
import type { Invitation } from '../../services/adminUserService'
import ConfirmDialog from '../cms/ConfirmDialog'

function personName(person: Invitation['user'] | null) {
    if (!person) return 'Unknown'
    return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.email || 'Unnamed user'
}

type PendingInvitationsProps = {
    canManage: boolean
    /** Limits the list to one person, e.g. on a team member's page. */
    userId?: string
    onError?: (message: string) => void
}

export default function PendingInvitations({ canManage, userId, onError }: PendingInvitationsProps) {
    const { data, isPending, isError, error } = useInvitations({ status: 'PENDING', userId })
    const revoke = useRevokeInvitation()
    const [revoking, setRevoking] = useState<Invitation | null>(null)

    if (isPending) return <div className="h-12 skeleton-shimmer rounded-[3px]" />
    if (isError) return <p className="text-sm text-red-800">{error.message}</p>
    if (data.length === 0) {
        return userId ? null : <p className="text-sm text-ink/55">No invitations are waiting for a reply.</p>
    }

    return (
        <>
            <ul className="divide-y divide-royal/10 rounded-[3px] border border-royal/15">
                {data.map((invitation) => (
                    <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                            <p className="truncate text-sm text-ink">
                                {personName(invitation.user)}{' '}
                                <span className="text-ink/50">→ {ROLE_LABELS[invitation.role]}</span>
                            </p>
                            <p className="truncate text-xs text-ink/50">
                                Invited by {personName(invitation.invitedBy)} · expires{' '}
                                {new Date(invitation.expiresAt).toLocaleDateString()}
                            </p>
                        </div>
                        {canManage ? (
                            <button
                                type="button"
                                onClick={() => setRevoking(invitation)}
                                className="text-xs text-red-700 transition hover:text-red-900"
                            >
                                Revoke
                            </button>
                        ) : null}
                    </li>
                ))}
            </ul>
            <ConfirmDialog
                open={revoking !== null}
                title="Revoke this invitation?"
                body={revoking ? `The link sent to ${revoking.user.email ?? 'this person'} will stop working.` : ''}
                confirmLabel="Revoke"
                tone="danger"
                busy={revoke.isPending}
                onConfirm={() => {
                    if (!revoking) return
                    revoke.mutate(revoking.id, {
                        onSettled: () => setRevoking(null),
                        onError: (err) => onError?.(err.message),
                    })
                }}
                onCancel={() => setRevoking(null)}
            />
        </>
    )
}
