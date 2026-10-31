import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    browseDocuments,
    createFolder,
    createShare,
    deleteDocument,
    deleteFolder,
    listShares,
    renameFolder,
    revokeShare,
    updateDocument,
    uploadDocument,
    type BrowseParams,
    type DocumentCategory,
    type DocumentStatus,
    type FileSpace,
} from '../services/documentService'

export const documentKeys = {
    all: ['documents'] as const,
    browse: (params: BrowseParams) => ['documents', 'browse', params] as const,
    shares: (fileId: string) => ['documents', 'shares', fileId] as const,
}

export function useDocumentBrowse(params: BrowseParams, enabled = true) {
    return useQuery({
        queryKey: documentKeys.browse(params),
        queryFn: () => browseDocuments(params),
        placeholderData: keepPreviousData,
        enabled,
    })
}

export function useDocumentShares(fileId: string | null) {
    return useQuery({
        queryKey: documentKeys.shares(fileId ?? ''),
        queryFn: () => listShares(fileId!),
        enabled: Boolean(fileId),
    })
}

function invalidateBrowse(queryClient: ReturnType<typeof useQueryClient>) {
    void queryClient.invalidateQueries({ queryKey: documentKeys.all })
}

export function useCreateFolder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createFolder,
        onSuccess: () => invalidateBrowse(queryClient),
    })
}

export function useRenameFolder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => renameFolder(id, name),
        onSuccess: () => invalidateBrowse(queryClient),
    })
}

export function useDeleteFolder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => deleteFolder(id),
        onSuccess: () => invalidateBrowse(queryClient),
    })
}

export function useUploadDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: uploadDocument,
        onSuccess: () => invalidateBrowse(queryClient),
    })
}

export function useUpdateDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            input,
        }: {
            id: string
            input: {
                displayName?: string
                category?: DocumentCategory
                status?: DocumentStatus
                notes?: string | null
                folderId?: string | null
            }
        }) => updateDocument(id, input),
        onSuccess: () => invalidateBrowse(queryClient),
    })
}

export function useDeleteDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => deleteDocument(id),
        onSuccess: () => invalidateBrowse(queryClient),
    })
}

export function useCreateShare() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            fileId,
            expiresInHours,
            maxDownloads,
        }: {
            fileId: string
            expiresInHours: 24 | 168 | 720
            maxDownloads?: number | null
        }) => createShare(fileId, { expiresInHours, maxDownloads }),
        onSuccess: (_data, vars) => {
            void queryClient.invalidateQueries({ queryKey: documentKeys.shares(vars.fileId) })
        },
    })
}

export function useRevokeShare() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shareId }: { shareId: string; fileId: string }) => revokeShare(shareId),
        onSuccess: (_data, vars) => {
            void queryClient.invalidateQueries({ queryKey: documentKeys.shares(vars.fileId) })
        },
    })
}

export type { FileSpace }
