import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { requestPasswordReset } from '../lib/authApi'
import { fieldClass, labelClass, linkClass, primaryButtonClass } from '../lib/formStyles'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setSubmitting(true)
        setError(null)
        try {
            await requestPasswordReset(email)
            navigate(`/verify-reset?email=${encodeURIComponent(email)}`, { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send reset code')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email and we will send a one-time code to reset your password."
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="forgot-email" className={labelClass}>
                        Email
                    </label>
                    <input
                        id="forgot-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={fieldClass}
                    />
                </div>
                {error && (
                    <p role="alert" className="text-sm text-red-300">
                        {error}
                    </p>
                )}
                <button type="submit" disabled={submitting} className={primaryButtonClass}>
                    {submitting ? 'Sending…' : 'Send reset code'}
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
