import { useEffect } from 'react'

import { applyPreferences, storedPreferences, watchSystemTheme } from '../lib/appearance'
import { usePreferences } from './useSettings'

const REDUCED_MOTION = { system: 'user', reduce: 'always', full: 'never' } as const

/**
 * Applies the signed-in user's saved preferences and follows the OS theme while it is `system`.
 * Returns the value for `MotionConfig reducedMotion`.
 */
export function useAppearanceSync() {
    const { data } = usePreferences()
    const prefs = data ?? storedPreferences()
    const key = JSON.stringify(prefs)

    useEffect(() => {
        const current = JSON.parse(key) as typeof prefs
        applyPreferences(current)
        if (current.theme !== 'system') return
        return watchSystemTheme(() => applyPreferences(current))
    }, [key])

    return REDUCED_MOTION[prefs.motion]
}
