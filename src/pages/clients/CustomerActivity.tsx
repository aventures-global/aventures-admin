import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import ActivityTimeline from '../../components/settings/ActivityTimeline'
import { useAdminUser } from '../../hooks/useAdminUsers'

export default function CustomerActivity() {
    const { id = '' } = useParams()
    const { data: user, isPending, isError, error, refetch } = useAdminUser(id)
    const name = user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unnamed customer'
        : ''

    return (
        <div>
            <Link
                to=".."
                relative="path"
                className="inline-flex items-center gap-1.5 text-sm text-ink/60 transition hover:text-royal"
            >
                <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
                Back to customer
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
                <div className="mt-4 max-w-3xl space-y-5">
                    <PageHeader
                        eyebrow="Customer"
                        title="Site activity"
                        description={`Full activity history for ${name}.`}
                    />
                    <ActivityTimeline user={user} />
                </div>
            )}
        </div>
    )
}
