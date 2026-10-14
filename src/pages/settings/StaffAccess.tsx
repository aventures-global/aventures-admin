import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import RoleBadge from '../../components/settings/RoleBadge'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { ghostActionClass, selectClass } from '../../lib/formStyles'
import { ROLE_LABELS } from '../../lib/roles'
import type { AdminUserListParams } from '../../services/adminUserService'
import type { AppUserRole } from '../../services/userService'

const PAGE_SIZE = 25

const SORT_OPTIONS: { id: string; label: string; sort: AdminUserListParams['sort']; dir: AdminUserListParams['dir'] }[] = [
    { id: 'newest', label: 'Newest first', sort: 'createdAt', dir: 'desc' },
    { id: 'oldest', label: 'Oldest first', sort: 'createdAt', dir: 'asc' },
    { id: 'email', label: 'Email A–Z', sort: 'email', dir: 'asc' },
    { id: 'role', label: 'Highest role first', sort: 'role', dir: 'desc' },
]

export default function StaffAccess() {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [params, setParams] = useState<AdminUserListParams>({
        q: '',
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
            <PageHeader
                eyebrow="Settings"
                title="Staff & access"
                description="Every account that has signed in to the website or this admin site. Only the super admin can change roles."
            />

            <div className="mt-6 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[14rem] flex-1">
                    <Search
                        size={15}
                        strokeWidth={1.6}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-deep"
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
                <select
                    aria-label="Role"
                    value={params.role}
                    onChange={(event) =>
                        setParams((prev) => ({ ...prev, role: event.target.value as AdminUserListParams['role'], page: 1 }))
                    }
                    className={`${selectClass} px-3`}
                >
                    <option value="all">All roles</option>
                    {(Object.keys(ROLE_LABELS) as AppUserRole[]).map((role) => (
                        <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                        </option>
                    ))}
                </select>
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
            </div>

            <div className="mt-4">
                {isPending ? (
                    <div className="space-y-2">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-12 skeleton-shimmer rounded-[3px]" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
                        <p className="text-sm text-red-800">{error.message}</p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="mt-4 text-sm font-medium text-royal transition hover:text-gold-deep"
                        >
                            Try again
                        </button>
                    </div>
                ) : data.items.length === 0 ? (
                    <div className="rounded-[3px] border border-royal/15 px-6 py-16 text-center">
                        <p className="font-noto-serif text-2xl text-ink">No users found</p>
                        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
                            People appear here after they sign in for the first time.
                        </p>
                    </div>
                ) : (
                    <>
                        <div
                            className={`paper-card overflow-x-auto rounded-[3px] transition-opacity ${isFetching ? 'opacity-70' : ''}`}
                        >
                            <table className="w-full min-w-[40rem] text-left text-sm">
                                <thead className="border-b border-royal/15 bg-cream text-[11px] uppercase tracking-[0.14em] text-ink/55">
                                    <tr>
                                        <th scope="col" className="px-3 py-2.5 font-normal">User</th>
                                        <th scope="col" className="px-3 py-2.5 font-normal">Phone</th>
                                        <th scope="col" className="px-3 py-2.5 font-normal">Role</th>
                                        <th scope="col" className="px-3 py-2.5 font-normal">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-royal/10">
                                    {data.items.map((user) => {
                                        const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
                                        return (
                                            <tr
                                                key={user.id}
                                                tabIndex={0}
                                                onClick={() => navigate(user.id)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') navigate(user.id)
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
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-ink/50">
                            <p>
                                {data.total} user{data.total === 1 ? '' : 's'}
                            </p>
                            {totalPages > 1 ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={params.page <= 1}
                                        onClick={() => setParams((prev) => ({ ...prev, page: prev.page - 1 }))}
                                        className={ghostActionClass}
                                    >
                                        Previous
                                    </button>
                                    <span className="tabular-nums">
                                        Page {params.page} of {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={params.page >= totalPages}
                                        onClick={() => setParams((prev) => ({ ...prev, page: prev.page + 1 }))}
                                        className={ghostActionClass}
                                    >
                                        Next
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
