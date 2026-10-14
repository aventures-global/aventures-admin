import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import RoleBadge from '../../components/settings/RoleBadge'
import { useAdminUser, useSetAdminUserRole, useUpdateAdminUser } from '../../hooks/useAdminUsers'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import { fieldClass, labelClass, primaryActionClass } from '../../lib/formStyles'
import { ROLE_LABELS } from '../../lib/roles'
import type { AssignableRole } from '../../services/adminUserService'
import type { AppUser } from '../../services/userService'

const ASSIGNABLE_ROLES: { role: AssignableRole; description: string }[] = [
    { role: 'CUSTOMER', description: 'Website account only. Cannot sign in to the admin site.' },
    { role: 'STAFF', description: 'Can sign in to the admin site and manage content.' },
    { role: 'ADMIN', description: 'Can sign in to the admin site and manage content.' },
]

export default function UserDetail() {
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
                Staff & access
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
                <UserDetailContent key={user.id} user={user} />
            )}
        </div>
    )
}

function UserDetailContent({ user }: { user: AppUser }) {
    const { appUser } = useAuth()
    const [notice, setNotice] = useNotice()
    const [form, setForm] = useState({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
    })
    const [pendingRole, setPendingRole] = useState<AssignableRole | null>(null)
    const updateUser = useUpdateAdminUser()
    const setRole = useSetAdminUserRole()

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    const isSelf = appUser?.id === user.id
    const canChangeRole = appUser?.role === 'SUPER_ADMIN' && !isSelf && user.role !== 'SUPER_ADMIN'

    const saveProfile = (event: FormEvent) => {
        event.preventDefault()
        updateUser.mutate(
            {
                id: user.id,
                input: {
                    firstName: form.firstName.trim() || null,
                    lastName: form.lastName.trim() || null,
                    phone: form.phone.trim() || null,
                },
            },
            {
                onSuccess: () => setNotice({ tone: 'ok', text: 'Profile saved' }),
                onError: (err) => setNotice({ tone: 'error', text: err.message }),
            },
        )
    }

    const confirmRole = () => {
        if (!pendingRole) return
        setRole.mutate(
            { id: user.id, role: pendingRole },
            {
                onSuccess: () => {
                    setPendingRole(null)
                    setNotice({ tone: 'ok', text: `Role changed to ${ROLE_LABELS[pendingRole]}` })
                },
                onError: (err) => {
                    setPendingRole(null)
                    setNotice({ tone: 'error', text: err.message })
                },
            },
        )
    }

    return (
        <div className="mt-4">
            <PageHeader
                eyebrow="User"
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

                <form onSubmit={saveProfile} className="paper-card space-y-4 rounded-[3px] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Profile</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="user-first-name" className={labelClass}>
                                First name
                            </label>
                            <input
                                id="user-first-name"
                                value={form.firstName}
                                maxLength={100}
                                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                                className={fieldClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="user-last-name" className={labelClass}>
                                Last name
                            </label>
                            <input
                                id="user-last-name"
                                value={form.lastName}
                                maxLength={100}
                                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                                className={fieldClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="user-phone" className={labelClass}>
                                Phone
                            </label>
                            <input
                                id="user-phone"
                                type="tel"
                                value={form.phone}
                                maxLength={40}
                                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                                className={fieldClass}
                            />
                        </div>
                        <div>
                            <p className={labelClass}>Email</p>
                            <p className="py-2 text-sm text-ink/60">{user.email ?? '—'}</p>
                        </div>
                    </div>
                    <p className="text-xs text-ink/45">
                        Email and password are managed by the user through their own account.
                    </p>
                    <div className="flex justify-end">
                        <button type="submit" disabled={updateUser.isPending} className={primaryActionClass}>
                            {updateUser.isPending ? 'Saving…' : 'Save profile'}
                        </button>
                    </div>
                </form>

                <section className="paper-card space-y-4 rounded-[3px] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Access</p>
                    {user.role === 'SUPER_ADMIN' ? (
                        <p className="text-sm text-ink/65">
                            This is the super admin account. Its role is set on the server and cannot be changed
                            here.
                        </p>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {ASSIGNABLE_ROLES.map(({ role, description }) => {
                                    const current = user.role === role
                                    return (
                                        <button
                                            key={role}
                                            type="button"
                                            disabled={!canChangeRole || current || setRole.isPending}
                                            onClick={() => setPendingRole(role)}
                                            className={`flex w-full items-start justify-between gap-3 rounded-[3px] border px-3 py-2.5 text-left transition ${
                                                current
                                                    ? 'border-royal bg-royal/[0.04]'
                                                    : 'border-royal/15 enabled:hover:border-royal/50'
                                            } disabled:cursor-default`}
                                        >
                                            <span>
                                                <span className="block text-sm text-ink">{ROLE_LABELS[role]}</span>
                                                <span className="block text-xs text-ink/55">{description}</span>
                                            </span>
                                            {current ? (
                                                <span className="shrink-0 text-xs text-royal">Current</span>
                                            ) : null}
                                        </button>
                                    )
                                })}
                            </div>
                            {!canChangeRole ? (
                                <p className="text-xs text-ink/45">
                                    {isSelf
                                        ? 'You cannot change your own role.'
                                        : 'Only the super admin can change roles.'}
                                </p>
                            ) : null}
                        </>
                    )}
                </section>
            </div>

            <ConfirmDialog
                open={pendingRole !== null}
                title={pendingRole ? `Make this user ${ROLE_LABELS[pendingRole].toLowerCase()}?` : ''}
                body={
                    pendingRole === 'CUSTOMER'
                        ? `${user.email ?? 'This user'} will lose access to the admin site.`
                        : `${user.email ?? 'This user'} will be able to sign in to the admin site.`
                }
                confirmLabel="Change role"
                tone={pendingRole === 'CUSTOMER' ? 'danger' : 'default'}
                busy={setRole.isPending}
                onConfirm={confirmRole}
                onCancel={() => setPendingRole(null)}
            />
        </div>
    )
}
