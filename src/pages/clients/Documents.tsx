import {
    ChevronRight,
    Download,
    File,
    Folder,
    FolderPlus,
    Link2,
    Search,
    Trash2,
    Upload,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminPanel, EmptyState, FilterBar, StatusBadge } from '../../components/admin'
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import Notice from '../../components/cms/faqs/Notice'
import CreateFolderDialog from '../../components/documents/CreateFolderDialog'
import ShareDialog from '../../components/documents/ShareDialog'
import UploadDocumentDialog from '../../components/documents/UploadDocumentDialog'
import PageHeader from '../../components/PageHeader'
import SelectMenu from '../../components/ui/SelectMenu'
import {
    useCreateFolder,
    useDeleteDocument,
    useDeleteFolder,
    useDocumentBrowse,
    useUpdateDocument,
    useUploadDocument,
} from '../../hooks/useDocuments'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import {
    fieldClass,
    ghostActionClass,
    primaryActionClass,
    segmentActiveClass,
    segmentGroupClass,
} from '../../lib/formStyles'
import {
    CATEGORY_LABELS,
    STATUS_LABELS,
    downloadDocument,
    formatBytes,
    type DocumentCategory,
    type DocumentFolder,
    type DocumentStatus,
    type FileSpace,
    type ManagedDocument,
} from '../../services/documentService'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DocumentCategory[]
const STATUSES = Object.keys(STATUS_LABELS) as DocumentStatus[]

const iconActionClass =
    'rounded-[3px] p-2 text-ink/45 transition hover:bg-royal/8 hover:text-royal disabled:pointer-events-none disabled:opacity-40'

const rowActionGroupClass =
    'flex flex-wrap items-center gap-0.5 opacity-100 transition-opacity max-lg:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100'

function documentStatusTone(status: DocumentStatus) {
    if (status === 'APPROVED') return 'success' as const
    if (status === 'REJECTED') return 'danger' as const
    return 'warning' as const
}

export default function Documents() {
    const { can } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const canView = can('documents.view')
    const canManage = can('documents.manage')
    const canShare = can('documents.share')

    const space = (searchParams.get('space') === 'INTERNAL' ? 'INTERNAL' : 'CUSTOMER') as FileSpace
    const ownerUserId = searchParams.get('customer') || undefined
    const folderId = searchParams.get('folder') || null
    const [q, setQ] = useState(searchParams.get('q') ?? '')
    const [debouncedQ, setDebouncedQ] = useState(q)
    const [category, setCategory] = useState<DocumentCategory | 'all'>('all')
    const [status, setStatus] = useState<DocumentStatus | 'all'>('all')
    const [shareFile, setShareFile] = useState<ManagedDocument | null>(null)
    const [folderOpen, setFolderOpen] = useState(false)
    const [folderError, setFolderError] = useState<string | null>(null)
    const [uploadOpen, setUploadOpen] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [pendingUploadFiles, setPendingUploadFiles] = useState<File[] | undefined>()
    const [deleteFolderTarget, setDeleteFolderTarget] = useState<DocumentFolder | null>(null)
    const [deleteFileTarget, setDeleteFileTarget] = useState<ManagedDocument | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const [notice, setNotice] = useNotice()

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250)
        return () => window.clearTimeout(timer)
    }, [q])

    const browseEnabled =
        canView && (space === 'INTERNAL' || Boolean(ownerUserId) || Boolean(debouncedQ))

    const browseParams = useMemo(
        () => ({
            space,
            ownerUserId,
            folderId: debouncedQ && !ownerUserId && space === 'CUSTOMER' ? undefined : folderId,
            q: debouncedQ,
            category,
            status,
        }),
        [space, ownerUserId, folderId, debouncedQ, category, status],
    )

    const { data, isPending, isError, error, refetch, isFetching } = useDocumentBrowse(
        {
            space: browseParams.space,
            ownerUserId: browseParams.ownerUserId,
            folderId: browseParams.folderId ?? null,
            q: browseParams.q,
            category: browseParams.category,
            status: browseParams.status,
        },
        browseEnabled,
    )

    const customers = useAdminUsers(
        { q: '', scope: 'customers', role: 'all', sort: 'email', dir: 'asc', page: 1, limit: 100 },
        { enabled: canView && space === 'CUSTOMER' },
    )

    const createFolder = useCreateFolder()
    const deleteFolder = useDeleteFolder()
    const uploadDocument = useUploadDocument()
    const updateDocument = useUpdateDocument()
    const deleteDocument = useDeleteDocument()

    const currentFolderLabel =
        data?.breadcrumb?.length ? data.breadcrumb[data.breadcrumb.length - 1]?.name : undefined

    const canUploadHere =
        canManage && (space === 'INTERNAL' || Boolean(ownerUserId))

    const setSpace = (next: FileSpace) => {
        const nextParams = new URLSearchParams()
        nextParams.set('space', next)
        setSearchParams(nextParams)
        setQ('')
        setCategory('all')
        setStatus('all')
        setDragOver(false)
    }

    const setCustomer = (id: string) => {
        const next = new URLSearchParams(searchParams)
        next.set('space', 'CUSTOMER')
        next.set('customer', id)
        next.delete('folder')
        setSearchParams(next)
    }

    const openFolder = (id: string | null) => {
        const next = new URLSearchParams(searchParams)
        if (id) next.set('folder', id)
        else next.delete('folder')
        setSearchParams(next)
    }

    const openUpload = (files?: File[]) => {
        if (space === 'CUSTOMER' && !ownerUserId) {
            setNotice({ tone: 'error', text: 'Select a customer before uploading' })
            return
        }
        setUploadError(null)
        setPendingUploadFiles(files?.length ? files : undefined)
        setUploadOpen(true)
    }

    const handleUpload = async (input: {
        files: File[]
        category: DocumentCategory
        displayName?: string
        notes?: string
    }) => {
        setUploadError(null)
        try {
            for (const [index, file] of input.files.entries()) {
                await uploadDocument.mutateAsync({
                    file,
                    space,
                    ownerUserId,
                    folderId,
                    category: space === 'CUSTOMER' ? input.category : 'OTHER',
                    displayName: index === 0 ? input.displayName : undefined,
                    notes: input.notes,
                })
            }
            setUploadOpen(false)
            setPendingUploadFiles(undefined)
            setNotice({
                tone: 'ok',
                text: input.files.length > 1 ? `Uploaded ${input.files.length} files` : 'File uploaded',
            })
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed')
        }
    }

    if (!canView) {
        return (
            <div>
                <PageHeader
                    eyebrow="Clients"
                    title="Documents"
                    description="You do not have permission to view documents."
                />
            </div>
        )
    }

    const searchingAcross = space === 'CUSTOMER' && Boolean(debouncedQ) && !ownerUserId
    const canManageHere = canManage && !searchingAcross && (space === 'INTERNAL' || Boolean(ownerUserId))

    return (
        <div>
            <PageHeader
                eyebrow="Clients"
                title="Documents"
                description="Customer travel documents and company files in one place. Share links are staff-only and can be revoked."
                actions={
                    canUploadHere ? (
                        <button type="button" className={primaryActionClass} onClick={() => openUpload()}>
                            <Upload size={15} />
                            Upload
                        </button>
                    ) : null
                }
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <div role="group" aria-label="File space" className={segmentGroupClass}>
                    {(
                        [
                            { id: 'CUSTOMER' as const, label: 'Customers' },
                            { id: 'INTERNAL' as const, label: 'Company files' },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            aria-pressed={space === tab.id}
                            onClick={() => setSpace(tab.id)}
                            className={`h-full rounded-[2px] px-3.5 text-sm transition ${
                                space === tab.id
                                    ? segmentActiveClass
                                    : 'text-ink/55 hover:text-royal'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                <Notice notice={notice} />
            </div>

            <div
                className={`mt-5 grid gap-5 ${
                    space === 'CUSTOMER' ? 'lg:grid-cols-[20rem_minmax(0,1fr)]' : ''
                }`}
            >
                {space === 'CUSTOMER' ? (
                    <aside className="admin-panel rounded-[3px] p-4">
                        <p className="text-xs font-medium text-ink/50">Customer</p>
                        <div className="mt-2 max-h-[min(70vh,36rem)] space-y-0.5 overflow-y-auto">
                            {customers.isPending ? (
                                <div className="h-24 skeleton-shimmer rounded-[3px]" />
                            ) : (
                                (customers.data?.items ?? []).map((user) => {
                                    const label =
                                        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                                        user.email ||
                                        user.id
                                    const active = ownerUserId === user.id
                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => setCustomer(user.id)}
                                            className={
                                                active
                                                    ? 'block w-full cursor-pointer rounded-[3px] bg-royal/10 px-2.5 py-2 text-left text-sm text-royal'
                                                    : 'block w-full cursor-pointer rounded-[3px] px-2.5 py-2 text-left text-sm text-ink/70 transition hover:bg-royal/[0.03] hover:text-royal'
                                            }
                                        >
                                            <span className="block truncate font-medium">{label}</span>
                                            {user.email ? (
                                                <span className="block truncate text-xs text-ink/45">{user.email}</span>
                                            ) : null}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                        {ownerUserId ? (
                            <Link
                                to={`/clients/customers/${ownerUserId}`}
                                className="mt-3 inline-block text-xs text-royal underline-offset-2 hover:underline"
                            >
                                Open customer profile
                            </Link>
                        ) : null}
                    </aside>
                ) : null}

                <div className="min-w-0 space-y-3">
                    <FilterBar>
                        <div className="relative min-w-[220px] flex-1">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                            />
                            <input
                                className={`${fieldClass} pl-9`}
                                placeholder={
                                    space === 'CUSTOMER'
                                        ? 'Search files or customers…'
                                        : 'Search company files…'
                                }
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                            />
                        </div>
                        {space === 'CUSTOMER' ? (
                            <>
                                <SelectMenu
                                    value={category}
                                    aria-label="Category"
                                    className="w-[12rem] shrink-0"
                                    onChange={setCategory}
                                    options={[
                                        { value: 'all', label: 'All categories' },
                                        ...CATEGORIES.map((item) => ({
                                            value: item,
                                            label: CATEGORY_LABELS[item],
                                        })),
                                    ]}
                                />
                                <SelectMenu
                                    value={status}
                                    aria-label="Status"
                                    className="w-[11rem] shrink-0"
                                    onChange={setStatus}
                                    options={[
                                        { value: 'all', label: 'All statuses' },
                                        ...STATUSES.map((item) => ({
                                            value: item,
                                            label: STATUS_LABELS[item],
                                        })),
                                    ]}
                                />
                            </>
                        ) : null}
                    </FilterBar>

                    <AdminPanel className="min-w-0 p-4 sm:p-5">
                        {!browseEnabled ? (
                            <EmptyState
                                title="Select a customer"
                                body="Choose someone from the list, or search across all customer documents."
                            />
                        ) : isPending && !data ? (
                            <div className="h-48 skeleton-shimmer rounded-[3px]" />
                        ) : isError ? (
                            <EmptyState
                                title="Couldn’t load documents"
                                body={error.message}
                                action={
                                    <button
                                        type="button"
                                        className={ghostActionClass}
                                        onClick={() => void refetch()}
                                    >
                                        Try again
                                    </button>
                                }
                            />
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border pb-3">
                                    <nav className="flex flex-wrap items-center gap-1 text-sm text-ink/60">
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-[3px] px-1.5 py-0.5 transition hover:bg-royal/5 hover:text-royal"
                                            onClick={() => openFolder(null)}
                                        >
                                            {space === 'INTERNAL' ? 'Company files' : 'Root'}
                                        </button>
                                        {(data?.breadcrumb ?? []).map((crumb) => (
                                            <span key={crumb.id} className="inline-flex items-center gap-1">
                                                <ChevronRight size={14} className="text-ink/30" />
                                                <button
                                                    type="button"
                                                    className="cursor-pointer rounded-[3px] px-1.5 py-0.5 transition hover:bg-royal/5 hover:text-royal"
                                                    onClick={() => openFolder(crumb.id)}
                                                >
                                                    {crumb.name}
                                                </button>
                                            </span>
                                        ))}
                                        {searchingAcross ? (
                                            <span className="ml-2 text-xs text-ink/45">Search results</span>
                                        ) : null}
                                        {isFetching ? (
                                            <span className="ml-2 text-xs text-ink/35">Updating…</span>
                                        ) : null}
                                    </nav>

                                    {canManageHere ? (
                                        <button
                                            type="button"
                                            className={ghostActionClass}
                                            onClick={() => {
                                                setFolderError(null)
                                                setFolderOpen(true)
                                            }}
                                        >
                                            <FolderPlus size={15} />
                                            New folder
                                        </button>
                                    ) : null}
                                </div>

                                <div
                                    className={`relative mt-3 rounded-[3px] transition ${
                                        dragOver
                                            ? 'border border-dashed border-royal bg-royal/5'
                                            : 'border border-transparent'
                                    }`}
                                    onDragEnter={(event) => {
                                        if (!canManageHere) return
                                        event.preventDefault()
                                        setDragOver(true)
                                    }}
                                    onDragOver={(event) => {
                                        if (!canManageHere) return
                                        event.preventDefault()
                                        setDragOver(true)
                                    }}
                                    onDragLeave={(event) => {
                                        if (!canManageHere) return
                                        const next = event.relatedTarget as Node | null
                                        if (next && event.currentTarget.contains(next)) return
                                        setDragOver(false)
                                    }}
                                    onDrop={(event) => {
                                        if (!canManageHere) return
                                        event.preventDefault()
                                        setDragOver(false)
                                        const dropped = Array.from(event.dataTransfer.files)
                                        if (dropped.length) openUpload(dropped)
                                    }}
                                >
                                    {dragOver ? (
                                        <p className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-sm font-medium text-royal">
                                            Drop to upload
                                        </p>
                                    ) : null}

                                    {(data?.folders.length ?? 0) === 0 &&
                                    (data?.files.length ?? 0) === 0 ? (
                                        <EmptyState
                                            title="No files here yet"
                                            body={
                                                canManageHere
                                                    ? 'Upload a file or create a folder to get started.'
                                                    : 'Nothing has been uploaded in this location.'
                                            }
                                            action={
                                                canManageHere ? (
                                                    <button
                                                        type="button"
                                                        className={primaryActionClass}
                                                        onClick={() => openUpload()}
                                                    >
                                                        <Upload size={15} />
                                                        Upload
                                                    </button>
                                                ) : undefined
                                            }
                                        />
                                    ) : (
                                        <ul className="divide-y divide-admin-border">
                                            {(data?.folders ?? []).map((folder) => (
                                                <li
                                                    key={folder.id}
                                                    className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-royal/[0.03]"
                                                >
                                                    <button
                                                        type="button"
                                                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                                                        onClick={() => openFolder(folder.id)}
                                                    >
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-royal/8 text-royal">
                                                            <Folder size={18} strokeWidth={1.5} />
                                                        </span>
                                                        <span className="truncate font-medium text-ink">
                                                            {folder.name}
                                                        </span>
                                                    </button>
                                                    {canManage ? (
                                                        <div className={rowActionGroupClass}>
                                                            <button
                                                                type="button"
                                                                className={iconActionClass}
                                                                title="Delete folder"
                                                                aria-label={`Delete folder ${folder.name}`}
                                                                onClick={() =>
                                                                    setDeleteFolderTarget(folder)
                                                                }
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </li>
                                            ))}
                                            {(data?.files ?? []).map((file) => (
                                                <li
                                                    key={file.id}
                                                    className="group flex flex-wrap items-center gap-3 px-3 py-3 transition-colors hover:bg-royal/[0.03]"
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-royal/8 text-royal">
                                                        <File size={18} strokeWidth={1.5} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium text-ink">
                                                            {file.displayName}
                                                        </p>
                                                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink/45">
                                                            <span>{formatBytes(file.sizeBytes)}</span>
                                                            {space === 'CUSTOMER' ? (
                                                                <>
                                                                    <span aria-hidden>·</span>
                                                                    <span>
                                                                        {CATEGORY_LABELS[file.category]}
                                                                    </span>
                                                                    <span aria-hidden>·</span>
                                                                    <StatusBadge
                                                                        tone={documentStatusTone(
                                                                            file.status,
                                                                        )}
                                                                    >
                                                                        {STATUS_LABELS[file.status]}
                                                                    </StatusBadge>
                                                                </>
                                                            ) : null}
                                                            {searchingAcross && file.owner ? (
                                                                <>
                                                                    <span aria-hidden>·</span>
                                                                    <span>
                                                                        {file.owner.name ||
                                                                            file.owner.email}
                                                                    </span>
                                                                </>
                                                            ) : null}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {canManage && space === 'CUSTOMER' ? (
                                                            <SelectMenu
                                                                value={file.status}
                                                                aria-label={`Status for ${file.displayName}`}
                                                                className="w-[8.5rem] shrink-0"
                                                                onChange={(next) =>
                                                                    updateDocument.mutate(
                                                                        {
                                                                            id: file.id,
                                                                            input: { status: next },
                                                                        },
                                                                        {
                                                                            onError: (err) =>
                                                                                setNotice({
                                                                                    tone: 'error',
                                                                                    text: err.message,
                                                                                }),
                                                                        },
                                                                    )
                                                                }
                                                                options={STATUSES.map((item) => ({
                                                                    value: item,
                                                                    label: STATUS_LABELS[item],
                                                                }))}
                                                            />
                                                        ) : null}
                                                        <div className={rowActionGroupClass}>
                                                            <button
                                                                type="button"
                                                                className={iconActionClass}
                                                                title="Download"
                                                                aria-label={`Download ${file.displayName}`}
                                                                onClick={() =>
                                                                    void downloadDocument(
                                                                        file.id,
                                                                        file.displayName,
                                                                    ).catch((err: Error) =>
                                                                        setNotice({
                                                                            tone: 'error',
                                                                            text: err.message,
                                                                        }),
                                                                    )
                                                                }
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                            {canShare ? (
                                                                <button
                                                                    type="button"
                                                                    className={iconActionClass}
                                                                    title="Share"
                                                                    aria-label={`Share ${file.displayName}`}
                                                                    onClick={() => setShareFile(file)}
                                                                >
                                                                    <Link2 size={14} />
                                                                </button>
                                                            ) : null}
                                                            {canManage ? (
                                                                <button
                                                                    type="button"
                                                                    className={iconActionClass}
                                                                    title="Delete"
                                                                    aria-label={`Delete ${file.displayName}`}
                                                                    onClick={() =>
                                                                        setDeleteFileTarget(file)
                                                                    }
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </>
                        )}
                    </AdminPanel>
                </div>
            </div>

            <CreateFolderDialog
                open={folderOpen}
                busy={createFolder.isPending}
                error={folderError}
                parentLabel={currentFolderLabel}
                onClose={() => {
                    if (createFolder.isPending) return
                    setFolderOpen(false)
                    setFolderError(null)
                }}
                onCreate={(name) => {
                    setFolderError(null)
                    createFolder.mutate(
                        {
                            space,
                            name,
                            parentId: folderId,
                            ownerUserId,
                        },
                        {
                            onSuccess: () => {
                                setFolderOpen(false)
                                setNotice({ tone: 'ok', text: 'Folder created' })
                            },
                            onError: (err) => setFolderError(err.message),
                        },
                    )
                }}
            />

            <UploadDocumentDialog
                open={uploadOpen}
                space={space}
                busy={uploadDocument.isPending}
                error={uploadError}
                initialFiles={pendingUploadFiles}
                onClose={() => {
                    if (uploadDocument.isPending) return
                    setUploadOpen(false)
                    setUploadError(null)
                    setPendingUploadFiles(undefined)
                }}
                onUpload={(input) => void handleUpload(input)}
            />

            <ShareDialog file={shareFile} open={Boolean(shareFile)} onClose={() => setShareFile(null)} />

            <ConfirmDialog
                open={Boolean(deleteFolderTarget)}
                title="Delete folder?"
                body={
                    deleteFolderTarget
                        ? `“${deleteFolderTarget.name}” and the files inside it will be removed. This cannot be undone.`
                        : ''
                }
                confirmLabel="Delete folder"
                tone="danger"
                busy={deleteFolder.isPending}
                onCancel={() => {
                    if (deleteFolder.isPending) return
                    setDeleteFolderTarget(null)
                }}
                onConfirm={() => {
                    if (!deleteFolderTarget) return
                    deleteFolder.mutate(deleteFolderTarget.id, {
                        onSuccess: () => {
                            setDeleteFolderTarget(null)
                            setNotice({ tone: 'ok', text: 'Folder deleted' })
                        },
                        onError: (err) => {
                            setDeleteFolderTarget(null)
                            setNotice({ tone: 'error', text: err.message })
                        },
                    })
                }}
            />

            <ConfirmDialog
                open={Boolean(deleteFileTarget)}
                title="Delete file?"
                body={
                    deleteFileTarget
                        ? `“${deleteFileTarget.displayName}” will be permanently removed.`
                        : ''
                }
                confirmLabel="Delete file"
                tone="danger"
                busy={deleteDocument.isPending}
                onCancel={() => {
                    if (deleteDocument.isPending) return
                    setDeleteFileTarget(null)
                }}
                onConfirm={() => {
                    if (!deleteFileTarget) return
                    deleteDocument.mutate(deleteFileTarget.id, {
                        onSuccess: () => {
                            setDeleteFileTarget(null)
                            setNotice({ tone: 'ok', text: 'File deleted' })
                        },
                        onError: (err) => {
                            setDeleteFileTarget(null)
                            setNotice({ tone: 'error', text: err.message })
                        },
                    })
                }}
            />
        </div>
    )
}
