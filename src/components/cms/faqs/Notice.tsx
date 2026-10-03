import type { NoticeValue } from '../../../hooks/useNotice'

export default function Notice({ notice }: { notice: NoticeValue }) {
    if (!notice) return null
    return (
        <p
            role="status"
            className={`rounded-[3px] border px-3 py-2 text-sm ${
                notice.tone === 'ok'
                    ? 'border-emerald-700/25 bg-emerald-50 text-emerald-800'
                    : 'border-red-700/25 bg-red-50 text-red-800'
            }`}
        >
            {notice.text}
        </p>
    )
}
