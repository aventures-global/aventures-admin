import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../lib/authContext'
import { linkClass, primaryButtonClass } from '../lib/formStyles'
import { ROLE_LABELS } from '../lib/roles'
import { acceptInvitation, lookupInvitation } from '../services/adminUserService'

const CLOSED_MESSAGES = {
    ACCEPTED: 'This invitation has already been accepted. Log in to continue.',
    REVOKED: 'This invitation was withdrawn. Ask the super admin for a new one.',
    EXPIRED: 'This invitation has expired. Ask the super admin for a new one.',
} as const

export default function AcceptInvite() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') ?? ''
    const navigate = useNavigate()
    const { isLoggedIn, refresh } = useAuth()

    const preview = useQuery({
        queryKey: ['invitation', token],
        queryFn: () => lookupInvitation(token),
        enabled: Boolean(token),
        retry: false,
    })

    const accept = useMutation({
        mutationFn: () => acceptInvitation(token),
        onSuccess: async (result) => {
            const notice = `You are now ${ROLE_LABELS[result.role].toLowerCase()}. Log in with ${result.email ?? 'your account'} to continue.`
            if (isLoggedIn && (await refresh()) === 'allowed') {
                navigate('/', { replace: true })
                return
            }
            navigate('/login', { replace: true, state: { notice } })
        },
    })

    if (!token || preview.isError) {
        return (
            <AuthLayout
                title="Invitation not found"
                description={preview.error?.message ?? 'This link is missing its invitation code.'}
            >
                <Link to="/login" className={linkClass}>
                    Go to log in
                </Link>
            </AuthLayout>
        )
    }

    if (preview.isPending) {
        return (
            <AuthLayout title="Checking invitation…">
                <div className="h-10 skeleton-paper rounded-[3px]" />
            </AuthLayout>
        )
    }

    const invitation = preview.data
    const roleName = ROLE_LABELS[invitation.role].toLowerCase()

    if (invitation.status !== 'PENDING') {
        return (
            <AuthLayout title="Invitation closed" description={CLOSED_MESSAGES[invitation.status]}>
                <Link to="/login" className={linkClass}>
                    Go to log in
                </Link>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Join the admin team"
            description={`${invitation.invitedBy} invited ${invitation.email ?? 'you'} to the AVENtures admin site as ${roleName === 'admin' ? 'an' : 'a'} ${roleName}.`}
        >
            <p className="text-xs text-ink/55">
                The invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}. After accepting, log in
                with the same account you use on the website.
            </p>
            {accept.error ? <p className="mt-3 text-sm text-red-800">{accept.error.message}</p> : null}
            <button
                type="button"
                disabled={accept.isPending}
                onClick={() => accept.mutate()}
                className={`${primaryButtonClass} mt-5`}
            >
                {accept.isPending ? 'Accepting…' : 'Accept invitation'}
            </button>
        </AuthLayout>
    )
}
