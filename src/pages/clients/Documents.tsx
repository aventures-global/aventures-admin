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
import ConfirmDialog from '../../components/cms/ConfirmDialog'
import Notice from '../../components/cms/faqs/Notice'
import CreateFolderDialog from '../../components/documents/CreateFolderDialog'
import ShareDialog from '../../components/documents/ShareDialog'
import UploadDocumentDialog from '../../components/documents/UploadDocumentDialog'
import PageHeader from '../../components/PageHeader'
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
import { fieldClass, ghostActionClass, primaryActionClass, selectClass } from '../../lib/formStyles'
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

    const setSpace = (next: FileSpace) => {
        const nextParams = new URLSearchParams()
        nextParams.set('space', next)
        setSearchParams(nextParams)
        setQ('')
        setCategory('all')
        setStatus('all')
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

    return (
        <div>
            <PageHeader
                eyebrow="Clients"
                title="Documents"
                description="Customer travel documents and company files in one place. Share links are staff-only and can be revoked."
            />

            <div className="mt-6 flex flex-wrap gap-2">
                {(
                    [
                        { id: 'CUSTOMER' as const, label: 'Customers' },
                        { id: 'INTERNAL' as const, label: 'Company files' },
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSpace(tab.id)}
                        className={
                            space === tab.id
                                ? 'rounded-[3px] bg-royal px-3.5 py-2 text-sm text-cream'
                                : 'rounded-[3px] border border-royal/25 px-3.5 py-2 text-sm text-ink/70 transition hover:border-royal hover:text-royal'
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                <Notice notice={notice} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
                <aside className="paper-card rounded-[3px] p-4">
                    {space === 'CUSTOMER' ? (
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/50">Customer</p>
                            <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
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
                                                        ? 'block w-full rounded-[3px] bg-royal/10 px-2.5 py-2 text-left text-sm text-royal'
                                                        : 'block w-full rounded-[3px] px-2.5 py-2 text-left text-sm text-ink/70 transition hover:bg-royal/5 hover:text-royal'
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
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/50">Company files</p>
                            <p className="mt-2 text-sm leading-6 text-ink/55">
                                Internal folders and files for the AVENtures team. Not visible to customers.
                            </p>
                        </div>
                    )}
                </aside>

                <section className="paper-card min-w-0 rounded-[3px] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[12rem] flex-1">
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
                                <select
                                    className={selectClass}
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value as DocumentCategory | 'all')}
                                >
                                    <option value="all">All categories</option>
                                    {CATEGORIES.map((item) => (
                                        <option key={item} value={item}>
                                            {CATEGORY_LABELS[item]}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className={selectClass}
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value as DocumentStatus | 'all')}
                                >
                                    <option value="all">All statuses</option>
                                    {STATUSES.map((item) => (
                                        <option key={item} value={item}>
                                            {STATUS_LABELS[item]}
                                        </option>
                                    ))}
                                </select>
                            </>
                        ) : null}
                    </div>

                    {!browseEnabled ? (
                        <div className="mt-10 px-4 py-12 text-center">
                            <Folder size={28} className="mx-auto text-royal/40" strokeWidth={1.4} />
                            <p className="mt-3 font-medium text-ink/80">Select a customer</p>
                            <p className="mt-1 text-sm text-ink/50">
                                Choose someone from the list, or search across all customer documents.
                            </p>
                        </div>
                    ) : isPending && !data ? (
                        <div className="mt-6 h-48 skeleton-shimmer rounded-[3px]" />
                    ) : isError ? (
                        <div className="mt-8 text-center">
                            <p className="text-sm text-red-800">{error.message}</p>
                            <button type="button" className={`${ghostActionClass} mt-3`} onClick={() => void refetch()}>
                                Try again
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-royal/10 pb-3">
                                <nav className="flex flex-wrap items-center gap-1 text-sm text-ink/60">
                                    <button type="button" className="hover:text-royal" onClick={() => openFolder(null)}>
                                        {space === 'INTERNAL' ? 'Company files' : 'Root'}
                                    </button>
                                    {(data?.breadcrumb ?? []).map((crumb) => (
                                        <span key={crumb.id} className="inline-flex items-center gap-1">
                                            <ChevronRight size={14} className="text-ink/30" />
                                            <button
                                                type="button"
                                                className="hover:text-royal"
                                                onClick={() => openFolder(crumb.id)}
                                            >
                                                {crumb.name}
                                            </button>
                                        </span>
                                    ))}
                                    {searchingAcross ? (
                                        <span className="ml-2 text-xs text-ink/45">Search results</span>
                                    ) : null}
                                    {isFetching ? <span className="ml-2 text-xs text-ink/35">Updating…</span> : null}
                                </nav>

                                {canManage && !searchingAcross && (space === 'INTERNAL' || ownerUserId) ? (
                                    <div className="flex flex-wrap items-center gap-2">
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
                                        <button
                                            type="button"
                                            className={primaryActionClass}
                                            onClick={() => openUpload()}
                                        >
                                            <Upload size={15} />
                                            Upload
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            <div
                                className="mt-3"
                                onDragOver={(event) => {
                                    if (!canManage || searchingAcross) return
                                    event.preventDefault()
                                }}
                                onDrop={(event) => {
                                    if (!canManage || searchingAcross) return
                                    event.preventDefault()
                                    const dropped = Array.from(event.dataTransfer.files)
                                    if (dropped.length) openUpload(dropped)
                                }}
                            >
                                {(data?.folders.length ?? 0) === 0 && (data?.files.length ?? 0) === 0 ? (
                                    <div className="px-4 py-14 text-center">
                                        <File size={26} className="mx-auto text-royal/35" strokeWidth={1.4} />
                                        <p className="mt-3 font-medium text-ink/75">No files here yet</p>
                                        <p className="mt-1 text-sm text-ink/50">
                                            {canManage
                                                ? 'Upload a file or create a folder to get started.'
                                                : 'Nothing has been uploaded in this location.'}
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-royal/10">
                                        {(data?.folders ?? []).map((folder) => (
                                            <li key={folder.id} className="flex items-center gap-3 py-3">
                                                <button
                                                    type="button"
                                                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                                    onClick={() => openFolder(folder.id)}
                                                >
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-royal/8 text-royal">
                                                        <Folder size={18} strokeWidth={1.5} />
                                                    </span>
                                                    <span className="truncate font-medium text-ink">{folder.name}</span>
                                                </button>
                                                {canManage ? (
                                                    <button
                                                        type="button"
                                                        className={ghostActionClass}
                                                        title="Delete folder"
                                                        onClick={() => setDeleteFolderTarget(folder)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                ) : null}
                                            </li>
                                        ))}
                                        {(data?.files ?? []).map((file) => (
                                            <li key={file.id} className="flex flex-wrap items-center gap-3 py-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-royal/8 text-royal">
                                                    <File size={18} strokeWidth={1.5} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-ink">{file.displayName}</p>
                                                    <p className="mt-0.5 text-xs text-ink/45">
                                                        {formatBytes(file.sizeBytes)}
                                                        {space === 'CUSTOMER' ? (
                                                            <>
                                                                {' · '}
                                                                {CATEGORY_LABELS[file.category]}
                                                                {' · '}
                                                                <StatusBadge status={file.status} />
                                                            </>
                                                        ) : null}
                                                        {searchingAcross && file.owner ? (
                                                            <>
                                                                {' · '}
                                                                {file.owner.name || file.owner.email}
                                                            </>
                                                        ) : null}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {canManage && space === 'CUSTOMER' ? (
                                                        <select
                                                            className={selectClass}
                                                            value={file.status}
                                                            onChange={(event) =>
                                                                updateDocument.mutate(
                                                                    {
                                                                        id: file.id,
                                                                        input: {
                                                                            status: event.target
                                                                                .value as DocumentStatus,
                                                                        },
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
                                                        >
                                                            {STATUSES.map((item) => (
                                                                <option key={item} value={item}>
                                                                    {STATUS_LABELS[item]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        className={ghostActionClass}
                                                        onClick={() =>
                                                            void downloadDocument(file.id, file.displayName).catch(
                                                                (err: Error) =>
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
                                                            className={ghostActionClass}
                                                            onClick={() => setShareFile(file)}
                                                        >
                                                            <Link2 size={14} />
                                                        </button>
                                                    ) : null}
                                                    {canManage ? (
                                                        <button
                                                            type="button"
                                                            className={ghostActionClass}
                                                            onClick={() => setDeleteFileTarget(file)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </section>
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

function StatusBadge({ status }: { status: DocumentStatus }) {
    const tone =
        status === 'APPROVED'
            ? 'text-emerald-800'
            : status === 'REJECTED'
              ? 'text-red-800'
              : 'text-amber-800'
    return <span className={tone}>{STATUS_LABELS[status]}</span>
}
