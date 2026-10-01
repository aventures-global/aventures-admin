import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../lib/authContext'
import { verifyResetOtp } from '../lib/authApi'
import { fieldClass, labelClass, linkClass, primaryButtonClass } from '../lib/formStyles'

export default function VerifyReset() {
    const { setVerificationCode } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const email = searchParams.get('email') ?? ''

    const [otp, setOtp] = useState('')
    const [error, setError] = useState<string | null>(null)
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
            await verifyResetOtp({ email, otp })
            setVerificationCode(otp)
            navigate(`/reset-password?email=${encodeURIComponent(email)}`, { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid code')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthLayout
            title="Verify reset code"
            description={
                <>
                    Enter the reset code sent to{' '}
                    <span className="text-ivory">{email || 'your email'}</span>.
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="reset-otp" className={labelClass}>
                        Reset code
                    </label>
                    <input
                        id="reset-otp"
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
                    <p role="alert" className="text-sm text-red-300">
                        {error}
                    </p>
                )}
                <button type="submit" disabled={submitting} className={primaryButtonClass}>
                    {submitting ? 'Checking…' : 'Continue'}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-silver/70">
                <Link to="/forgot-password" className={linkClass}>
                    Request a new code
                </Link>
            </p>
        </AuthLayout>
    )
}
