import { api } from './api'

export type AppUserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export type AppUser = {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    phone: string | null
    profilePicture: string | null
    role: AppUserRole
    createdAt: string
    updatedAt: string
}

function splitName(name?: string | null) {
    const trimmed = name?.trim() ?? ''
    if (!trimmed) return { firstName: null, lastName: null }
    const parts = trimmed.split(/\s+/)
    return {
        firstName: parts[0] ?? null,
        lastName: parts.slice(1).join(' ') || null,
    }
}

export async function bootstrapUser(seed: {
    name?: string | null
    email?: string | null
    image?: string | null
}) {
    const { firstName, lastName } = splitName(seed.name)
    const { data } = await api.post<{ user: AppUser }>('/api/me/bootstrap', {
        email: seed.email ?? null,
        firstName,
        lastName,
        profilePicture: seed.image && /^https?:\/\//i.test(seed.image) ? seed.image : null,
    })
    return data.user
}
