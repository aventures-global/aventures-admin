import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../lib/authContext'
import { resetPassword } from '../lib/authApi'
import { fieldClass, labelClass, linkClass, primaryButtonClass } from '../lib/formStyles'

export default function ResetPassword() {
    const { otp, setVerificationCode } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const email = searchParams.get('email') ?? ''

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    if (!otp || !email) {
        return <Navigate to="/forgot-password" replace />
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        if (password !== confirm) {
            setError('Passwords do not match')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            await resetPassword({ email, otp: otp!, password })
            setVerificationCode(null)
            navigate('/login', {
                replace: true,
                state: { notice: 'Password updated. Log in with your new password.' },
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not reset password')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthLayout
            title="Set new password"
            description={
                <>
                    Choose a new password for{' '}
                    <span className="text-ivory">{email}</span>.
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="new-password" className={labelClass}>
                        New password
                    </label>
                    <input
                        id="new-password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={fieldClass}
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password" className={labelClass}>
                        Confirm password
                    </label>
                    <input
                        id="confirm-password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                        className={fieldClass}
                    />
                </div>
                {error && (
                    <p role="alert" className="text-sm text-red-300">
                        {error}
                    </p>
                )}
                <button type="submit" disabled={submitting} className={primaryButtonClass}>
                    {submitting ? 'Saving…' : 'Update password'}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-silver/70">
                <Link to="/login" className={linkClass}>
                    Back to log in
                </Link>
            </p>
        </AuthLayout>
    )
}
