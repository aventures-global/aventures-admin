import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

/** Asks before leaving the page or closing the tab while there are unsaved changes. */
export function useUnsavedGuard(dirty: boolean) {
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
    )

    useEffect(() => {
        if (!dirty) return
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault()
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [dirty])

    return blocker
}
