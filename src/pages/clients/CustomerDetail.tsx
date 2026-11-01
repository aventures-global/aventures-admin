import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CustomerMetrics from '../../components/clients/CustomerMetrics'
import CustomerProfileHero from '../../components/clients/CustomerProfileHero'
import RecentPayments from '../../components/clients/RecentPayments'
import RecentQuotations from '../../components/clients/RecentQuotations'
import Notice from '../../components/cms/faqs/Notice'
import ActivityTimeline from '../../components/settings/ActivityTimeline'
import UserProfileForm from '../../components/settings/UserProfileForm'
import { useAdminUser, useUpdateAdminUser } from '../../hooks/useAdminUsers'
import { useNotice } from '../../hooks/useNotice'
import { usePayments } from '../../hooks/usePayments'
import { useQuotations } from '../../hooks/useQuotations'
import { useAuth } from '../../lib/authContext'
import { ghostActionClass } from '../../lib/formStyles'
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
                <div className="mt-6 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="h-56 skeleton-shimmer rounded-[3px] lg:col-span-2" />
                        <div className="h-56 skeleton-shimmer rounded-[3px]" />
                    </div>
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
    const [editing, setEditing] = useState(false)
    const updateUser = useUpdateAdminUser()
    const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unnamed customer'
    const canEdit = can('clients.edit') && user.role === 'CUSTOMER'
    const canViewDocuments = can('documents.view') && user.role === 'CUSTOMER'
    const canViewQuotations = can('quotations.view') && user.role === 'CUSTOMER'
    const canViewPayments = can('payments.view') && user.role === 'CUSTOMER'

    const recentQuotes = useQuotations(
        { customerUserId: user.id, page: 1, limit: 5 },
        canViewQuotations,
    )
    const convertedQuotes = useQuotations(
        { customerUserId: user.id, status: 'CONVERTED', page: 1, limit: 1 },
        canViewQuotations,
    )
    const recentPayments = usePayments(
        { customerUserId: user.id, page: 1, limit: 5 },
        canViewPayments,
    )

    const metricsLoading = canViewQuotations && (recentQuotes.isPending || convertedQuotes.isPending)
    const metrics = [
        {
            label: 'Member since',
            value: new Date(user.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
            }),
        },
        {
            label: 'Quotations',
            value: canViewQuotations
                ? recentQuotes.data
                    ? String(recentQuotes.data.total)
                    : '—'
                : '—',
        },
        {
            label: 'Trips',
            value: canViewQuotations
                ? convertedQuotes.data
                    ? String(convertedQuotes.data.total)
                    : '—'
                : '—',
        },
        {
            label: 'Last updated',
            value: new Date(user.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }),
        },
    ]

    if (editing) {
        return (
            <div className="mt-4 max-w-3xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Edit profile</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{displayName}</h1>
                    </div>
                    <button type="button" onClick={() => setEditing(false)} className={ghostActionClass}>
                        Cancel
                    </button>
                </div>
                <Notice notice={notice} />
                <UserProfileForm
                    user={user}
                    readOnly={!canEdit}
                    saving={updateUser.isPending}
                    onSave={(input) =>
                        updateUser.mutate(
                            { id: user.id, input },
                            {
                                onSuccess: () => {
                                    setNotice({ tone: 'ok', text: 'Profile saved' })
                                    setEditing(false)
                                },
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
            </div>
        )
    }

    return (
        <div className="mt-4 space-y-4">
            <Notice notice={notice} />

            <div className="grid items-start gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <section className="admin-panel space-y-5 rounded-[3px] p-5">
                        <CustomerProfileHero
                            user={user}
                            displayName={displayName}
                            canEdit={canEdit}
                            canViewDocuments={canViewDocuments}
                            canViewQuotations={canViewQuotations}
                            canViewPayments={canViewPayments}
                            onEdit={() => setEditing(true)}
                        />
                        {user.role !== 'CUSTOMER' ? (
                            <p className="text-xs text-ink/45">
                                This account is on the team now. Manage it from Settings, Team & access.
                            </p>
                        ) : null}
                        <CustomerMetrics metrics={metrics} loading={metricsLoading} />
                    </section>
                    <section className="admin-panel rounded-[3px] px-5 py-16 text-center">
                        <p className="text-sm text-ink/55">Contents will appear here</p>
                        <p className="mt-1 text-xs text-ink/40">
                            AVENtures stories and other shares from this customer will show up in this space.
                        </p>
                    </section>
                </div>

                <div className="space-y-4">
                    {canViewQuotations ? (
                        <RecentQuotations
                            customerId={user.id}
                            items={recentQuotes.data?.items ?? []}
                            isPending={recentQuotes.isPending}
                            isError={recentQuotes.isError}
                            errorMessage={recentQuotes.error?.message}
                        />
                    ) : (
                        <section className="admin-panel rounded-[3px] p-5">
                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">
                                Recent quotations
                            </p>
                            <p className="mt-3 text-sm text-ink/55">
                                You do not have permission to view quotations.
                            </p>
                        </section>
                    )}
                    {canViewPayments ? (
                        <RecentPayments
                            customerId={user.id}
                            items={recentPayments.data?.items ?? []}
                            isPending={recentPayments.isPending}
                            isError={recentPayments.isError}
                            errorMessage={recentPayments.error?.message}
                        />
                    ) : null}
                    <ActivityTimeline
                        user={user}
                        limit={5}
                        compact
                        seeAllTo={`/clients/customers/${encodeURIComponent(user.id)}/activity`}
                    />
                </div>
            </div>
        </div>
    )
}
