import type { Preferences } from '../services/userService'

const STORAGE_KEY = 'aventures-admin-preferences'

export const DEFAULT_PREFERENCES: Preferences = {
    theme: 'system',
    accent: 'royal',
    font: 'poppins',
    textSize: 'default',
    density: 'comfortable',
    motion: 'system',
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function storedPreferences(): Preferences {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Preferences>
        return { ...DEFAULT_PREFERENCES, ...parsed }
    } catch {
        return DEFAULT_PREFERENCES
    }
}

/** Caches the choices locally so the next page load paints correctly before the API answers. */
export function applyPreferences(prefs: Preferences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    const root = document.documentElement.dataset
    root.theme = prefs.theme === 'system' ? (darkQuery().matches ? 'dark' : 'light') : prefs.theme
    root.accent = prefs.accent
    root.font = prefs.font
    root.textSize = prefs.textSize
    root.density = prefs.density
    root.motion = prefs.motion
}

/** Called on logout so the next person on a shared browser starts from the defaults. */
export function clearStoredPreferences() {
    applyPreferences(DEFAULT_PREFERENCES)
    localStorage.removeItem(STORAGE_KEY)
}

export function watchSystemTheme(onChange: () => void) {
    const query = darkQuery()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
}
