import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
    AdminPanel,
    DataTableBody,
    DataTableHead,
    EmptyState,
    FilterBar,
    Pagination,
    StatusBadge,
} from '../../components/admin'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import SelectMenu from '../../components/ui/SelectMenu'
import {
    useFinanceEntries,
    useFinanceSummary,
    useVoidFinanceEntry,
} from '../../hooks/useFinance'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import { fieldClass, ghostActionClass, primaryActionClass } from '../../lib/formStyles'
import type { FinanceEntryType } from '../../services/financeService'

function monthRange() {
    const now = new Date()
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    return { from: from.toISOString(), to: to.toISOString() }
}

export default function Finance() {
    const { can } = useAuth()
    const canView = can('finance.view')
    const canManage = can('finance.manage')
    const location = useLocation()
    const [notice, setNotice] = useNotice()
    const [q, setQ] = useState('')
    const [debouncedQ, setDebouncedQ] = useState('')
    const [type, setType] = useState<FinanceEntryType | 'all'>('all')
    const [page, setPage] = useState(1)
    const range = useMemo(() => monthRange(), [])

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250)
        return () => window.clearTimeout(timer)
    }, [q])

    useEffect(() => {
        setPage(1)
    }, [debouncedQ, type])

    useEffect(() => {
        const text = (location.state as { financeNotice?: string } | null)?.financeNotice
        if (text) setNotice({ tone: 'ok', text })
    }, [location.state, setNotice])

    const params = useMemo(
        () => ({ q: debouncedQ, type, page, limit: 20, from: range.from, to: range.to }),
        [debouncedQ, type, page, range],
    )

    const entries = useFinanceEntries(params, canView)
    const summary = useFinanceSummary(range, canView)
    const voidEntry = useVoidFinanceEntry()
    const totalPages = entries.data ? Math.max(1, Math.ceil(entries.data.total / entries.data.limit)) : 1

    if (!canView) {
        return (
            <div>
                <PageHeader
                    eyebrow="Insights"
                    title="Finance"
                    description="You do not have permission to view the finance ledger."
                />
                <Outlet />
            </div>
        )
    }

    return (
        <div>
            <PageHeader
                eyebrow="Insights"
                title="Finance"
                description="Manual income and expense ledger with cashflow for the current month."
                actions={
                    canManage ? (
                        <Link to="/insights/finance/new" className={primaryActionClass}>
                            <Plus size={15} strokeWidth={1.75} />
                            Add entry
                        </Link>
                    ) : null
                }
            />

            <div className="mt-4 space-y-3">
                <Notice notice={notice} />

                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        { label: 'Income', value: summary.data?.income },
                        { label: 'Expense', value: summary.data?.expense },
                        { label: 'Net', value: summary.data?.net },
                    ].map((card) => (
                        <div key={card.label} className="admin-panel rounded-[3px] p-4">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-ink/45">
                                {card.label}
                            </p>
                            {summary.isPending ? (
                                <div className="mt-2 h-7 skeleton-shimmer rounded-[3px]" />
                            ) : (
                                <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                                    {card.value ?? '—'}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {summary.data?.byCategory.length ? (
                    <AdminPanel className="overflow-hidden">
                        <div className="border-b border-admin-border px-4 py-3">
                            <h2 className="text-sm font-semibold text-ink">By category (this month)</h2>
                        </div>
                        <table className="w-full text-left text-sm">
                            <DataTableHead>
                                <tr>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-right">Count</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {summary.data.byCategory.map((row) => (
                                    <tr key={`${row.categoryId}-${row.type}`}>
                                        <td className="px-4 py-3">{row.name}</td>
                                        <td className="px-4 py-3">{row.type}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{row.count}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{row.amount}</td>
                                    </tr>
                                ))}
                            </DataTableBody>
                        </table>
                    </AdminPanel>
                ) : null}

                <FilterBar>
                    <div className="relative min-w-[220px] flex-1">
                        <Search
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                        />
                        <input
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Search description or category"
                            className={`${fieldClass} pl-9`}
                        />
                    </div>
                    <SelectMenu
                        value={type}
                        aria-label="Entry type"
                        className="w-[10rem] shrink-0"
                        onChange={setType}
                        options={[
                            { value: 'all', label: 'All types' },
                            { value: 'INCOME', label: 'Income' },
                            { value: 'EXPENSE', label: 'Expense' },
                        ]}
                    />
                </FilterBar>

                {entries.isPending ? (
                    <AdminPanel className="overflow-hidden">
                        <div className="skeleton-paper h-48" />
                    </AdminPanel>
                ) : entries.isError ? (
                    <AdminPanel className="p-6">
                        <p className="text-sm text-red-800">{entries.error.message}</p>
                    </AdminPanel>
                ) : !entries.data?.items.length ? (
                    <AdminPanel>
                        <EmptyState
                            title="No ledger entries this month"
                            body="Record expenses here, or collect customer payments to auto-post income."
                        />
                    </AdminPanel>
                ) : (
                    <AdminPanel className={`overflow-hidden ${entries.isFetching ? 'opacity-70' : ''}`}>
                        <table className="w-full text-left text-sm">
                            <DataTableHead>
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {entries.data.items.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-4 py-3 text-ink/65">
                                            {new Date(entry.occurredAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-ink">{entry.description}</p>
                                                {entry.paymentId ? (
                                                    <p className="text-xs text-ink/45">From customer payment</p>
                                                ) : null}
                                                {entry.voidedAt ? (
                                                    <StatusBadge tone="danger">Voided</StatusBadge>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{entry.category.name}</td>
                                        <td className="px-4 py-3">{entry.type}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{entry.amount}</td>
                                        <td className="px-4 py-3 text-right">
                                            {canManage && !entry.voidedAt && !entry.paymentId ? (
                                                <button
                                                    type="button"
                                                    className={`${ghostActionClass} px-2 py-1 text-red-700`}
                                                    disabled={voidEntry.isPending}
                                                    onClick={() =>
                                                        voidEntry.mutate(
                                                            { id: entry.id },
                                                            {
                                                                onSuccess: () =>
                                                                    setNotice({
                                                                        tone: 'ok',
                                                                        text: 'Entry voided',
                                                                    }),
                                                                onError: (err) =>
                                                                    setNotice({
                                                                        tone: 'error',
                                                                        text: err.message,
                                                                    }),
                                                            },
                                                        )
                                                    }
                                                >
                                                    Void
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </DataTableBody>
                        </table>
                    </AdminPanel>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={entries.data?.total}
                    onPageChange={setPage}
                    isFetching={entries.isFetching}
                />
            </div>

            <Outlet />
        </div>
    )
}
