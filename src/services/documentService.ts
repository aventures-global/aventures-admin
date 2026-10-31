import { api } from './api'

export type FileSpace = 'CUSTOMER' | 'INTERNAL'
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type DocumentCategory = 'PASSPORT' | 'ID' | 'VISA' | 'SUPPORTING' | 'OTHER'
export type ShareStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'EXHAUSTED'

export type DocumentPerson = {
    id: string
    email: string | null
    name: string | null
}

export type DocumentFolder = {
    id: string
    space: FileSpace
    name: string
    parentId: string | null
    ownerUserId: string | null
    createdAt: string
    updatedAt: string
}

export type ManagedDocument = {
    id: string
    space: FileSpace
    folderId: string | null
    folder: { id: string; name: string; parentId: string | null } | null
    ownerUserId: string | null
    owner: DocumentPerson | null
    uploadedBy: DocumentPerson | null
    displayName: string
    category: DocumentCategory
    status: DocumentStatus
    contentType: string
    sizeBytes: number
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type DocumentShare = {
    id: string
    fileId: string
    file?: {
        id: string
        displayName: string
        contentType?: string
        sizeBytes?: number
    }
    createdBy: DocumentPerson | null
    expiresAt: string
    revokedAt: string | null
    downloadCount: number
    maxDownloads: number | null
    createdAt: string
    status: ShareStatus
    token?: string
    url?: string
}

export type BrowseResult = {
    space: FileSpace
    ownerUserId: string | null
    folderId: string | null
    breadcrumb: { id: string; name: string }[]
    folders: DocumentFolder[]
    files: ManagedDocument[]
}

export type BrowseParams = {
    space: FileSpace
    ownerUserId?: string
    folderId?: string | null
    q?: string
    category?: DocumentCategory | 'all'
    status?: DocumentStatus | 'all'
}

export async function browseDocuments(params: BrowseParams): Promise<BrowseResult> {
    const { data } = await api.get<BrowseResult>('/api/admin/documents', {
        params: {
            space: params.space,
            ownerUserId: params.ownerUserId,
            folderId: params.folderId ?? 'root',
            q: params.q ?? '',
            category: params.category ?? 'all',
            status: params.status ?? 'all',
        },
    })
    return data
}

export async function createFolder(input: {
    space: FileSpace
    name: string
    parentId?: string | null
    ownerUserId?: string
}): Promise<DocumentFolder> {
    const { data } = await api.post<{ folder: DocumentFolder }>('/api/admin/documents/folders', input)
    return data.folder
}

export async function renameFolder(id: string, name: string): Promise<DocumentFolder> {
    const { data } = await api.patch<{ folder: DocumentFolder }>(
        `/api/admin/documents/folders/${encodeURIComponent(id)}`,
        { name },
    )
    return data.folder
}

export async function deleteFolder(id: string): Promise<void> {
    await api.delete(`/api/admin/documents/folders/${encodeURIComponent(id)}`)
}

export async function uploadDocument(input: {
    file: File
    space: FileSpace
    ownerUserId?: string
    folderId?: string | null
    displayName?: string
    category?: DocumentCategory
    notes?: string
}): Promise<ManagedDocument> {
    const form = new FormData()
    form.append('file', input.file)
    form.append('space', input.space)
    if (input.ownerUserId) form.append('ownerUserId', input.ownerUserId)
    if (input.folderId) form.append('folderId', input.folderId)
    if (input.displayName) form.append('displayName', input.displayName)
    if (input.category) form.append('category', input.category)
    if (input.notes) form.append('notes', input.notes)
    const { data } = await api.post<{ file: ManagedDocument }>('/api/admin/documents/files', form)
    return data.file
}

export async function updateDocument(
    id: string,
    input: {
        displayName?: string
        category?: DocumentCategory
        status?: DocumentStatus
        notes?: string | null
        folderId?: string | null
    },
): Promise<ManagedDocument> {
    const { data } = await api.patch<{ file: ManagedDocument }>(
        `/api/admin/documents/files/${encodeURIComponent(id)}`,
        input,
    )
    return data.file
}

export async function deleteDocument(id: string): Promise<void> {
    await api.delete(`/api/admin/documents/files/${encodeURIComponent(id)}`)
}

export async function downloadDocument(id: string, displayName: string): Promise<void> {
    const { data } = await api.get<Blob>(`/api/admin/documents/files/${encodeURIComponent(id)}/download`, {
        responseType: 'blob',
    })
    const url = URL.createObjectURL(data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = displayName
    anchor.click()
    URL.revokeObjectURL(url)
}

export async function listShares(fileId: string): Promise<DocumentShare[]> {
    const { data } = await api.get<{ shares: DocumentShare[] }>(
        `/api/admin/documents/files/${encodeURIComponent(fileId)}/shares`,
    )
    return data.shares
}

export async function createShare(
    fileId: string,
    input: { expiresInHours: 24 | 168 | 720; maxDownloads?: number | null },
): Promise<DocumentShare> {
    const { data } = await api.post<{ share: DocumentShare }>(
        `/api/admin/documents/files/${encodeURIComponent(fileId)}/shares`,
        input,
    )
    return data.share
}

export async function revokeShare(shareId: string): Promise<DocumentShare> {
    const { data } = await api.post<{ share: DocumentShare }>(
        `/api/admin/documents/shares/${encodeURIComponent(shareId)}/revoke`,
    )
    return data.share
}

export function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
    PASSPORT: 'Passport',
    ID: 'ID',
    VISA: 'Visa',
    SUPPORTING: 'Supporting',
    OTHER: 'Other',
}

export const STATUS_LABELS: Record<DocumentStatus, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
}
