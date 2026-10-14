import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { linkClass, primaryButtonClass } from '../lib/formStyles'
import { publicSiteUrl } from '../lib/publicSite'

export default function Signup() {
    return (
        <AuthLayout title="Get admin access" description="Admin accounts are granted, not created here.">
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink/70">
                <li>Create an account on the AVENtures website, or sign in there once if you already have one.</li>
                <li>Ask the super admin to give your account staff or admin access.</li>
                <li>Come back here and log in with the same email.</li>
            </ol>

            <a
                href={publicSiteUrl('/signup')}
                target="_blank"
                rel="noreferrer"
                className={`mt-5 block text-center ${primaryButtonClass}`}
            >
                Create an account on the website
            </a>

            <p className="mt-4 text-center text-sm text-ink/60">
                Already have access?{' '}
                <Link to="/login" className={linkClass}>
                    Log in
                </Link>
            </p>
        </AuthLayout>
    )
}
