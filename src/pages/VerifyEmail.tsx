import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../lib/authContext'
import { resendVerificationEmail, verifyEmailOtp } from '../lib/authApi'
import { fieldClass, labelClass, linkClass, primaryButtonClass } from '../lib/formStyles'
import { safeNext } from '../lib/safeNext'

export default function VerifyEmail() {
    const { refresh } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const email = searchParams.get('email') ?? ''
    const next = safeNext(searchParams.get('next'))

    const [otp, setOtp] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        if (!email) {
            setError('Missing email address')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            await verifyEmailOtp({ email, otp })
            const status = await refresh()
            if (status === 'allowed') {
                navigate(next, { replace: true })
            } else if (status === 'denied') {
                navigate('/login', { replace: true })
            } else {
                navigate(`/login?next=${encodeURIComponent(next)}`, {
                    replace: true,
                    state: { notice: 'Email verified. Log in to continue.' },
                })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleResend() {
        if (!email) return
        setMessage(null)
        setError(null)
        try {
            await resendVerificationEmail(email)
            setMessage('A new code was sent to your email.')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not resend code')
        }
    }

    return (
        <AuthLayout
            title="Verify email"
            description={
                <>
                    Enter the one-time code we sent to{' '}
                    <span className="text-ivory">{email || 'your email'}</span>.
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="verify-otp" className={labelClass}>
                        Verification code
                    </label>
                    <input
                        id="verify-otp"
                        type="text"
                        required
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        className={fieldClass}
                    />
                </div>
                {error && (
                    <p role="alert" className="text-sm text-red-700">
                        {error}
                    </p>
                )}
                {message && <p className="text-sm text-emerald-700">{message}</p>}
                <button type="submit" disabled={submitting} className={primaryButtonClass}>
                    {submitting ? 'Verifying…' : 'Verify email'}
                </button>
            </form>

            <button
                type="button"
                onClick={() => {
                    void handleResend()
                }}
                className={`mt-3 w-full text-center text-sm ${linkClass}`}
            >
                Resend code
            </button>

            <p className="mt-4 text-center text-sm text-ink/60">
                <Link to="/login" className={linkClass}>
                    Back to log in
                </Link>
            </p>
        </AuthLayout>
    )
}
