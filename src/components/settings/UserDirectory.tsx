import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminPanel, DataTableBody, DataTableHead, EmptyState, FilterBar, Pagination } from '../admin'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { selectClass } from '../../lib/formStyles'
import { ROLE_LABELS } from '../../lib/roles'
import type { AdminUserListParams, UserScope } from '../../services/adminUserService'
import type { AppUser, AppUserRole } from '../../services/userService'
import RoleBadge from './RoleBadge'

const PAGE_SIZE = 25

const SORT_OPTIONS: { id: string; label: string; sort: AdminUserListParams['sort']; dir: AdminUserListParams['dir'] }[] = [
    { id: 'newest', label: 'Newest first', sort: 'createdAt', dir: 'desc' },
    { id: 'oldest', label: 'Oldest first', sort: 'createdAt', dir: 'asc' },
    { id: 'email', label: 'Email A–Z', sort: 'email', dir: 'asc' },
    { id: 'role', label: 'Highest role first', sort: 'role', dir: 'desc' },
]

type UserDirectoryProps = {
    scope: UserScope
    /** Role filter choices; omit to hide the filter. */
    roles?: AppUserRole[]
    emptyTitle: string
    emptyBody: string
    onSelect: (user: AppUser) => void
}

export default function UserDirectory({ scope, roles, emptyTitle, emptyBody, onSelect }: UserDirectoryProps) {
    const [query, setQuery] = useState('')
    const [params, setParams] = useState<AdminUserListParams>({
        q: '',
        scope,
        role: 'all',
        sort: 'createdAt',
        dir: 'desc',
        page: 1,
        limit: PAGE_SIZE,
    })
    const { data, isPending, isError, error, refetch, isFetching } = useAdminUsers(params)

    useEffect(() => {
        if (query.trim() === params.q) return
        const timer = window.setTimeout(() => setParams((prev) => ({ ...prev, q: query.trim(), page: 1 })), 300)
        return () => window.clearTimeout(timer)
    }, [query, params.q])

    const sortId = SORT_OPTIONS.find((option) => option.sort === params.sort && option.dir === params.dir)?.id
    const totalPages = data ? Math.max(1, Math.ceil(data.total / params.limit)) : 1

    return (
        <div>
            <FilterBar>
                <div className="relative min-w-[14rem] flex-1">
                    <Search
                        size={15}
                        strokeWidth={1.6}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                        aria-hidden
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by email, name, or phone…"
                        aria-label="Search users"
                        autoComplete="off"
                        className={`${selectClass} w-full pr-9 pl-9 placeholder:text-ink/40 [&::-webkit-search-cancel-button]:hidden`}
                    />
                    {query ? (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/45 transition hover:bg-royal/5 hover:text-royal"
                        >
                            <X size={14} strokeWidth={1.6} />
                        </button>
                    ) : null}
                </div>
                {roles ? (
                    <select
                        aria-label="Role"
                        value={params.role}
                        onChange={(event) =>
                            setParams((prev) => ({
                                ...prev,
                                role: event.target.value as AdminUserListParams['role'],
                                page: 1,
                            }))
                        }
                        className={`${selectClass} px-3`}
                    >
                        <option value="all">All roles</option>
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                            </option>
                        ))}
                    </select>
                ) : null}
                <select
                    aria-label="Sort"
                    value={sortId}
                    onChange={(event) => {
                        const option = SORT_OPTIONS.find((item) => item.id === event.target.value)
                        if (option) setParams((prev) => ({ ...prev, sort: option.sort, dir: option.dir, page: 1 }))
                    }}
                    className={`${selectClass} px-3`}
                >
                    {SORT_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </FilterBar>

            <div className="mt-3">
                {isPending ? (
                    <AdminPanel className="overflow-hidden">
                        <div className="space-y-2 p-4">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="skeleton-paper h-10 rounded-[3px]" />
                            ))}
                        </div>
                    </AdminPanel>
                ) : isError ? (
                    <AdminPanel>
                        <EmptyState
                            title="Couldn’t load users"
                            body={error.message}
                            action={
                                <button
                                    type="button"
                                    onClick={() => void refetch()}
                                    className="text-sm font-medium text-royal hover:underline"
                                >
                                    Try again
                                </button>
                            }
                        />
                    </AdminPanel>
                ) : data.items.length === 0 ? (
                    <AdminPanel>
                        <EmptyState title={emptyTitle} body={emptyBody} />
                    </AdminPanel>
                ) : (
                    <>
                        <AdminPanel className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-70' : ''}`}>
                            <table className="w-full min-w-[40rem] text-left text-sm">
                                <DataTableHead>
                                    <tr>
                                        <th scope="col" className="px-3 py-2.5 font-medium">
                                            User
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 font-medium">
                                            Phone
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 font-medium">
                                            Role
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 font-medium">
                                            Joined
                                        </th>
                                    </tr>
                                </DataTableHead>
                                <DataTableBody>
                                    {data.items.map((user) => {
                                        const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
                                        return (
                                            <tr
                                                key={user.id}
                                                tabIndex={0}
                                                onClick={() => onSelect(user)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') onSelect(user)
                                                }}
                                                className="cursor-pointer transition-colors hover:bg-royal/[0.03] focus-visible:bg-royal/[0.05] focus-visible:outline-none"
                                            >
                                                <td className="px-3 py-2.5">
                                                    <p className="text-ink">{name || user.email || 'Unnamed user'}</p>
                                                    {name && user.email ? (
                                                        <p className="text-xs text-ink/45">{user.email}</p>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 py-2.5 text-ink/60">{user.phone || '—'}</td>
                                                <td className="px-3 py-2.5">
                                                    <RoleBadge role={user.role} />
                                                </td>
                                                <td className="px-3 py-2.5 text-ink/60">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </DataTableBody>
                            </table>
                        </AdminPanel>
                        <Pagination
                            page={params.page}
                            totalPages={totalPages}
                            total={data.total}
                            isFetching={isFetching}
                            onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
