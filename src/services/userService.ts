import { api } from './api'

export type AppUserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN'

export type Capability = 'content.edit' | 'clients.view' | 'clients.edit' | 'team.view' | 'business.edit'

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

export type Theme = 'light' | 'dark' | 'system'
export type Accent = 'royal' | 'emerald' | 'burgundy' | 'slate' | 'gold'
export type FontFace = 'poppins' | 'inter' | 'system' | 'serif'
export type TextSize = 'small' | 'default' | 'large'
export type Density = 'comfortable' | 'compact'
export type MotionPreference = 'system' | 'reduce' | 'full'

export type Preferences = {
    theme: Theme
    accent: Accent
    font: FontFace
    textSize: TextSize
    density: Density
    motion: MotionPreference
}

export type ProfileInput = {
    firstName: string | null
    lastName: string | null
    phone: string | null
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
    const { data } = await api.post<{ user: AppUser; permissions: Capability[] }>('/api/me/bootstrap', {
        email: seed.email ?? null,
        firstName,
        lastName,
        profilePicture: seed.image && /^https?:\/\//i.test(seed.image) ? seed.image : null,
    })
    return data
}

export async function updateMe(input: Partial<ProfileInput> & { profilePicture?: string | null }): Promise<AppUser> {
    const { data } = await api.patch<{ user: AppUser }>('/api/me', input)
    return data.user
}

export async function getPreferences(): Promise<Preferences> {
    const { data } = await api.get<Preferences>('/api/me/preferences')
    return data
}

export async function updatePreferences(input: Partial<Preferences>): Promise<Preferences> {
    const { data } = await api.put<Preferences>('/api/me/preferences', input)
    return data
}
