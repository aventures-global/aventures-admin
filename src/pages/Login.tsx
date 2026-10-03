import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../lib/authContext'
import {
    fieldClass,
    labelClass,
    linkClass,
    primaryButtonClass,
    secondaryButtonClass,
} from '../lib/formStyles'
import { safeNext } from '../lib/safeNext'

export default function Login() {
    const { login, loginWithGoogle, error } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const next = safeNext(searchParams.get('next'))
    const notice = (location.state as { notice?: string } | null)?.notice

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setFormError(null)
        setSubmitting(true)
        try {
            await login({ email, password })
            navigate(next, { replace: true })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed'
            setFormError(message)
            if (message.toLowerCase().includes('verif')) {
                navigate(
                    `/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
                    { replace: true },
                )
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthLayout title="Log in" description="Staff and administrators only.">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="login-email" className={labelClass}>
                        Email
                    </label>
                    <input
                        id="login-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={fieldClass}
                    />
                </div>
                <div>
                    <label htmlFor="login-password" className={labelClass}>
                        Password
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={fieldClass}
                    />
                </div>

                {notice && !(formError || error) && (
                    <p className="text-sm text-emerald-700">{notice}</p>
                )}
                {(formError || error) && (
                    <p role="alert" className="text-sm text-red-700">
                        {formError || error}
                    </p>
                )}

                <button type="submit" disabled={submitting} className={primaryButtonClass}>
                    {submitting ? 'Signing in…' : 'Log in'}
                </button>
            </form>

            <button
                type="button"
                onClick={() => {
                    void loginWithGoogle()
                }}
                className={`mt-2 ${secondaryButtonClass}`}
            >
                Continue with Google
            </button>

            <p className="mt-4 text-center text-sm text-ink/60">
                <Link to="/forgot-password" className={linkClass}>
                    Forgot password?
                </Link>
            </p>
            <p className="mt-2 text-center text-sm text-ink/60">
                No account yet?{' '}
                <Link to={`/signup?next=${encodeURIComponent(next)}`} className={linkClass}>
                    Create one
                </Link>
            </p>
        </AuthLayout>
    )
}
