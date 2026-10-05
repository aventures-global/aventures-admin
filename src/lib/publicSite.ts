const FALLBACK_SITE_URL = import.meta.env.DEV ? 'http://localhost:5173' : 'https://aventures-client.vercel.app'

/** Absolute URL on the public site, for "view live" links. */
export function publicSiteUrl(path: string): string {
    const base = ((import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || FALLBACK_SITE_URL).replace(/\/$/, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
