import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import ActivityTimeline from '../../components/settings/ActivityTimeline'
import RoleBadge from '../../components/settings/RoleBadge'
import UserProfileForm from '../../components/settings/UserProfileForm'
import { useAdminUser, useUpdateAdminUser } from '../../hooks/useAdminUsers'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import type { AppUser } from '../../services/userService'

export default function CustomerDetail() {
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
                Customers
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
                <CustomerContent key={user.id} user={user} />
            )}
        </div>
    )
}

function CustomerContent({ user }: { user: AppUser }) {
    const { can } = useAuth()
    const [notice, setNotice] = useNotice()
    const updateUser = useUpdateAdminUser()
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    const canEdit = can('clients.edit') && user.role === 'CUSTOMER'

    return (
        <div className="mt-4">
            <PageHeader
                eyebrow="Customer"
                title={name || user.email || 'Unnamed customer'}
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
                    readOnly={!canEdit}
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
                        user.role !== 'CUSTOMER'
                            ? 'This account is on the team now. Manage it from Settings, Team & access.'
                            : 'Email and password are managed by the customer through their own account.'
                    }
                />
                <ActivityTimeline user={user} />
            </div>
        </div>
    )
}
