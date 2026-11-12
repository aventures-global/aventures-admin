import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { adminUserKeys, useAdminUsers } from '../../hooks/useAdminUsers'
import { fieldClass } from '../../lib/formStyles'
import { getAdminUser } from '../../services/adminUserService'
import type { AppUser } from '../../services/userService'

export type CustomerOption = {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    profilePicture: string | null
    displayName: string
}

function displayNameOf(user: Pick<AppUser, 'firstName' | 'lastName' | 'email' | 'id'>) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.id
}

function toOption(user: AppUser): CustomerOption {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        displayName: displayNameOf(user),
    }
}

export function CustomerAvatar({
    person,
    size = 'md',
}: {
    person: Pick<CustomerOption, 'displayName' | 'profilePicture'>
    size?: 'sm' | 'md'
}) {
    const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm'
    const initial = (person.displayName.trim().charAt(0) || '?').toUpperCase()
    if (person.profilePicture) {
        return (
            <img
                src={person.profilePicture}
                alt=""
                className={`${dim} shrink-0 rounded-full border border-admin-border object-cover`}
            />
        )
    }
    return (
        <span
            className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-royal/15 font-medium text-royal`}
            aria-hidden
        >
            {initial}
        </span>
    )
}

export default function CustomerPicker({
    value,
    selected,
    onChange,
    onQuoteUnregistered,
    invalid = false,
    disabled = false,
    readOnly = false,
}: {
    value: string
    selected: CustomerOption | null
    onChange: (next: CustomerOption | null) => void
    /** Shown when search returns no registered customers. */
    onQuoteUnregistered?: (searchText: string) => void
    invalid?: boolean
    disabled?: boolean
    readOnly?: boolean
}) {
    const listId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const [debounced, setDebounced] = useState('')
    const [open, setOpen] = useState(false)
    const [highlight, setHighlight] = useState(0)

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(query.trim()), 300)
        return () => window.clearTimeout(timer)
    }, [query])

    const { data, isFetching } = useAdminUsers(
        {
            scope: 'customers',
            q: debounced,
            role: 'all',
            sort: 'createdAt',
            dir: 'desc',
            limit: 8,
            page: 1,
        },
        { enabled: !readOnly && !disabled && !selected && debounced.length >= 2 },
    )

    const { data: prefilled } = useQuery({
        queryKey: adminUserKeys.detail(value),
        queryFn: () => getAdminUser(value),
        enabled: Boolean(value) && !selected && !readOnly,
    })

    useEffect(() => {
        if (selected || !prefilled) return
        onChange(toOption(prefilled))
    }, [prefilled, selected, onChange])

    const results = useMemo(() => (data?.items ?? []).map(toOption), [data?.items])

    useEffect(() => {
        setHighlight(0)
    }, [debounced, results.length])

    const pick = (option: CustomerOption) => {
        onChange(option)
        setQuery('')
        setDebounced('')
        setOpen(false)
    }

    const clear = () => {
        onChange(null)
        setQuery('')
        setDebounced('')
        setOpen(false)
        window.requestAnimationFrame(() => inputRef.current?.focus())
    }

    if (selected || readOnly) {
        const person = selected
        if (!person) {
            return <p className="text-sm text-ink/50">No customer</p>
        }
        return (
            <div className="flex items-center gap-3 rounded-[3px] border border-admin-border bg-admin-surface px-3 py-2">
                <CustomerAvatar person={person} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{person.displayName}</p>
                    <p className="truncate text-xs text-ink/50">{person.email ?? 'No email'}</p>
                </div>
                {!readOnly && !disabled ? (
                    <button
                        type="button"
                        className="rounded-[3px] p-1 text-ink/45 transition hover:bg-royal/[0.06] hover:text-royal"
                        onClick={clear}
                        aria-label="Clear customer"
                    >
                        <X size={15} strokeWidth={1.75} />
                    </button>
                ) : null}
            </div>
        )
    }

    const showList = open && debounced.length >= 2

    return (
        <div className="relative">
            <div className="relative">
                <Search
                    size={15}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                    aria-hidden
                />
                <input
                    ref={inputRef}
                    type="search"
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        showList && results[highlight] ? `${listId}-option-${results[highlight].id}` : undefined
                    }
                    aria-invalid={invalid || undefined}
                    disabled={disabled}
                    value={query}
                    autoComplete="off"
                    placeholder="Search customers by name or email"
                    className={`${fieldClass} pl-9 ${invalid ? 'border-red-500 focus:border-red-500' : ''}`}
                    onChange={(event) => {
                        setQuery(event.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        window.setTimeout(() => setOpen(false), 150)
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault()
                            setOpen(false)
                            return
                        }
                        if (!showList || results.length === 0) {
                            if (event.key === 'Enter') event.preventDefault()
                            return
                        }
                        if (event.key === 'ArrowDown') {
                            event.preventDefault()
                            setHighlight((prev) => Math.min(prev + 1, results.length - 1))
                            return
                        }
                        if (event.key === 'ArrowUp') {
                            event.preventDefault()
                            setHighlight((prev) => Math.max(prev - 1, 0))
                            return
                        }
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            const option = results[highlight]
                            if (option) pick(option)
                        }
                    }}
                />
            </div>

            {showList ? (
                <ul
                    id={listId}
                    role="listbox"
                    className={`absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-[3px] border border-admin-border bg-admin-surface py-1 shadow-[0_12px_28px_rgba(15,19,26,0.14)] transition-opacity ${
                        isFetching ? 'opacity-70' : ''
                    }`}
                >
                    {results.length === 0 ? (
                        <li className="px-3 py-2">
                            <p className="text-xs text-ink/50">No customers match.</p>
                            {onQuoteUnregistered && !isFetching ? (
                                <button
                                    type="button"
                                    className="mt-2 w-full rounded-[3px] border border-royal/20 bg-royal/[0.04] px-3 py-2 text-left text-sm font-medium text-royal transition hover:border-royal/40 hover:bg-royal/[0.08]"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                        onQuoteUnregistered(debounced)
                                        setQuery('')
                                        setDebounced('')
                                        setOpen(false)
                                    }}
                                >
                                    Quote an unregistered customer
                                </button>
                            ) : null}
                        </li>
                    ) : (
                        results.map((user, index) => {
                            const active = index === highlight
                            return (
                                <li key={user.id} role="presentation">
                                    <button
                                        type="button"
                                        id={`${listId}-option-${user.id}`}
                                        role="option"
                                        aria-selected={active}
                                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                                            active ? 'bg-royal/[0.08]' : 'hover:bg-royal/[0.04]'
                                        }`}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => setHighlight(index)}
                                        onClick={() => pick(user)}
                                    >
                                        <CustomerAvatar person={user} size="sm" />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm text-ink">
                                                {user.displayName}
                                            </span>
                                            <span className="block truncate text-xs text-ink/50">
                                                {user.email ?? 'No email'}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            )
                        })
                    )}
                </ul>
            ) : debounced.length > 0 && debounced.length < 2 && open ? (
                <p className="mt-1 text-xs text-ink/45">Type at least two characters.</p>
            ) : null}
        </div>
    )
}
