import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import ActivityTimeline from '../../components/settings/ActivityTimeline'
import InviteDialog from '../../components/settings/InviteDialog'
import PendingInvitations from '../../components/settings/PendingInvitations'
import RoleBadge from '../../components/settings/RoleBadge'
import UserProfileForm from '../../components/settings/UserProfileForm'
import { useAdminUser, useSetAdminUserRole, useUpdateAdminUser } from '../../hooks/useAdminUsers'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import { ghostActionClass } from '../../lib/formStyles'
import { ROLE_LABELS, isPromotion } from '../../lib/roles'
import type { AssignableRole } from '../../services/adminUserService'
import type { AppUser } from '../../services/userService'

const LOWER_ROLES: { role: AssignableRole; label: string; description: string }[] = [
    { role: 'STAFF', label: 'Change to staff', description: 'Keeps admin-site access with staff permissions.' },
    { role: 'CUSTOMER', label: 'Remove access', description: 'Website account only. Cannot sign in to the admin site.' },
]

export default function TeamMemberDetail() {
    const { id = '' } = useParams()
    const { data: user, isPending, isError, error, refetch } = useAdminUser(id)

    return (
        <div>
            <Link
                to=".."
                relative="path"
                className="inline-flex items-center gap-1.5 text-sm text-ink/60 transition hover:text-royal"
            >
                <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
                Team & access
            </Link>

            {isPending ? (
                <div className="mt-6 space-y-3">
                    <div className="h-10 w-64 skeleton-shimmer rounded-[3px]" />
                    <div className="h-48 skeleton-shimmer rounded-[3px]" />
                </div>
            ) : isError ? (
                <div className="mt-6 rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
                    <p className="text-sm text-red-800">{error.message}</p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="mt-4 text-sm font-medium text-royal transition hover:text-gold-deep"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <TeamMemberContent key={user.id} user={user} />
            )}
        </div>
    )
}

function TeamMemberContent({ user }: { user: AppUser }) {
    const { appUser } = useAuth()
    const [notice, setNotice] = useNotice()
    const [pendingRole, setPendingRole] = useState<AssignableRole | null>(null)
    const [inviting, setInviting] = useState(false)
    const updateUser = useUpdateAdminUser()
    const setRole = useSetAdminUserRole()

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    const isSelf = appUser?.id === user.id
    const isSuperAdmin = appUser?.role === 'SUPER_ADMIN'
    const canManage = isSuperAdmin && !isSelf && user.role !== 'SUPER_ADMIN'
    const lowerRoles = LOWER_ROLES.filter((option) => isPromotion(option.role, user.role))

    const confirmRole = () => {
        if (!pendingRole) return
        setRole.mutate(
            { id: user.id, role: pendingRole },
            {
                onSuccess: () => setNotice({ tone: 'ok', text: `Role changed to ${ROLE_LABELS[pendingRole]}` }),
                onError: (err) => setNotice({ tone: 'error', text: err.message }),
                onSettled: () => setPendingRole(null),
            },
        )
    }

    return (
        <div className="mt-4">
            <PageHeader
                eyebrow="Team member"
                title={name || user.email || 'Unnamed user'}
                description={
                    <>
                        {user.email ?? 'No email'} · Joined {new Date(user.createdAt).toLocaleDateString()}
                    </>
                }
                actions={<RoleBadge role={user.role} />}
            />

            <div className="mt-6 max-w-3xl space-y-5">
                <Notice notice={notice} />

                <UserProfileForm
                    user={user}
                    readOnly={!isSuperAdmin || isSelf}
                    saving={updateUser.isPending}
                    onSave={(input) =>
                        updateUser.mutate(
                            { id: user.id, input },
                            {
                                onSuccess: () => setNotice({ tone: 'ok', text: 'Profile saved' }),
                                onError: (err) => setNotice({ tone: 'error', text: err.message }),
                            },
                        )
                    }
                    note={
                        isSelf
                            ? 'Edit your own details in Personal settings.'
                            : isSuperAdmin
                              ? 'Email and password are managed by the person through their own account.'
                              : 'Only the super admin can edit team member profiles.'
                    }
                />

                <section className="paper-card space-y-4 rounded-[3px] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Access</p>
                    {user.role === 'SUPER_ADMIN' ? (
                        <p className="text-sm text-ink/65">
                            This is the super admin account. Its role is set on the server and cannot be changed here.
                        </p>
                    ) : !canManage ? (
                        <p className="text-sm text-ink/65">
                            {isSelf ? 'You cannot change your own role.' : 'Only the super admin can change roles.'}
                        </p>
                    ) : (
                        <>
                            {user.role !== 'ADMIN' ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-royal/15 px-3 py-2.5">
                                    <span>
                                        <span className="block text-sm text-ink">
                                            {user.role === 'CUSTOMER' ? 'Invite to the team' : 'Promote to admin'}
                                        </span>
                                        <span className="block text-xs text-ink/55">
                                            Sends an invitation. The role changes once they accept.
                                        </span>
                                    </span>
                                    <button type="button" onClick={() => setInviting(true)} className={ghostActionClass}>
                                        Send invitation
                                    </button>
                                </div>
                            ) : null}
                            {lowerRoles.map((option) => (
                                <div
                                    key={option.role}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-royal/15 px-3 py-2.5"
                                >
                                    <span>
                                        <span className="block text-sm text-ink">{option.label}</span>
                                        <span className="block text-xs text-ink/55">{option.description}</span>
                                    </span>
                                    <button
                                        type="button"
                                        disabled={setRole.isPending}
                                        onClick={() => setPendingRole(option.role)}
                                        className={ghostActionClass}
                                    >
                                        {option.label}
                                    </button>
                                </div>
                            ))}
                            <PendingInvitations
                                canManage
                                userId={user.id}
                                onError={(text) => setNotice({ tone: 'error', text })}
                            />
                        </>
                    )}
                </section>

                <ActivityTimeline user={user} />
            </div>

            <ConfirmDialog
                open={pendingRole !== null}
                title={pendingRole ? `Make this user ${ROLE_LABELS[pendingRole].toLowerCase()}?` : ''}
                body={
                    pendingRole === 'CUSTOMER'
                        ? `${user.email ?? 'This user'} will lose access to the admin site.`
                        : `${user.email ?? 'This user'} will keep admin-site access with staff permissions.`
                }
                confirmLabel="Change role"
                tone={pendingRole === 'CUSTOMER' ? 'danger' : 'default'}
                busy={setRole.isPending}
                onConfirm={confirmRole}
                onCancel={() => setPendingRole(null)}
            />
            <InviteDialog open={inviting} onClose={() => setInviting(false)} user={user} />
        </div>
    )
}
