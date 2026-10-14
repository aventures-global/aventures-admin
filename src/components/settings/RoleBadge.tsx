import { ROLE_LABELS } from '../../lib/roles'
import type { AppUserRole } from '../../services/userService'

const ROLE_STYLES: Record<AppUserRole, string> = {
    CUSTOMER: 'bg-royal/5 text-ink/65',
    STAFF: 'bg-sky-50 text-sky-800',
    ADMIN: 'bg-emerald-50 text-emerald-800',
    SUPER_ADMIN: 'bg-gold-deep/15 text-gold-deep',
}

export default function RoleBadge({ role }: { role: AppUserRole }) {
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${ROLE_STYLES[role]}`}>
            {ROLE_LABELS[role]}
        </span>
    )
}
