import type { AppUserRole } from '../services/userService'

export const ROLE_LABELS: Record<AppUserRole, string> = {
    CUSTOMER: 'Customer',
    STAFF: 'Staff',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super admin',
}

export const TEAM_ROLES: AppUserRole[] = ['STAFF', 'ADMIN', 'SUPER_ADMIN']

const ROLE_RANK: Record<AppUserRole, number> = { CUSTOMER: 0, STAFF: 1, ADMIN: 2, SUPER_ADMIN: 3 }

export function isPromotion(from: AppUserRole, to: AppUserRole) {
    return ROLE_RANK[to] > ROLE_RANK[from]
}
