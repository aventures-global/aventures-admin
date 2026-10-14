import type { AppUserRole } from '../services/userService'

export const ROLE_LABELS: Record<AppUserRole, string> = {
    CUSTOMER: 'Customer',
    STAFF: 'Staff',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super admin',
}
