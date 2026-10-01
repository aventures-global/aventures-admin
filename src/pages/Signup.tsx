import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

export default function Signup() {
    const { signup, loginWithGoogle } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const next = safeNext(searchParams.get('next'))

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setFormError(null)
        setSubmitting(true)
        try {
            await signup({ name, email, password })
            navigate(
                `/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
                { replace: true },
            )
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Sign up failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthLayout
            title="Create account"
            description="New accounts need the STAFF or ADMIN role before they can open the admin site."
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="signup-name" className={labelClass}>
                        Name
                    </label>
                    <input
                        id="signup-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className={fieldClass}
                    />
                </div>
                <div>
                    <label htmlFor="signup-email" className={labelClass}>
                        Email
                    </label>
                    <input
                        id="signup-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={fieldClass}
                    />
                </div>
                <div>
                    <label htmlFor="signup-password" className={labelClass}>
                        Password
                    </label>
                    <input
                        id="signup-password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={fieldClass}
                    />
                </div>

                {formError && (
                    <p role="alert" className="text-sm text-red-300">
                        {formError}
                    </p>
                )}

                <button type="submit" disabled={submitting} className={primaryButtonClass}>
                    {submitting ? 'Creating…' : 'Create account'}
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

            <p className="mt-4 text-center text-sm text-silver/70">
                Already have an account?{' '}
                <Link to={`/login?next=${encodeURIComponent(next)}`} className={linkClass}>
                    Log in
                </Link>
            </p>
        </AuthLayout>
    )
}
