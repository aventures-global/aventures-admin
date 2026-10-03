import { useEffect, useState } from 'react'

export type NoticeValue = { tone: 'ok' | 'error'; text: string } | null

/** Status message that clears itself after success; errors stay until replaced. */
export function useNotice() {
    const [notice, setNotice] = useState<NoticeValue>(null)

    useEffect(() => {
        if (!notice || notice.tone === 'error') return
        const timer = window.setTimeout(() => setNotice(null), 2500)
        return () => window.clearTimeout(timer)
    }, [notice])

    return [notice, setNotice] as const
}
