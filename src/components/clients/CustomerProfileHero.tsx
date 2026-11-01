import { FileText, FolderOpen, Pencil, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import RoleBadge from '../settings/RoleBadge'
import { ghostActionClass } from '../../lib/formStyles'
import type { AppUser } from '../../services/userService'

type CustomerProfileHeroProps = {
    user: AppUser
    displayName: string
    canEdit: boolean
    canViewDocuments: boolean
    canViewQuotations: boolean
    canViewPayments: boolean
    onEdit: () => void
}

export default function CustomerProfileHero({
    user,
    displayName,
    canEdit,
    canViewDocuments,
    canViewQuotations,
    canViewPayments,
    onEdit,
}: CustomerProfileHeroProps) {
    const initial = (displayName.trim().charAt(0) || '?').toUpperCase()

    return (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
                {user.profilePicture ? (
                    <img
                        src={user.profilePicture}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-full border border-royal/15 object-cover"
                    />
                ) : (
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-royal text-2xl font-medium text-white">
                        {initial}
                    </span>
                )}
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
                            {displayName}
                        </h1>
                        <RoleBadge role={user.role} />
                    </div>
                    <p className="truncate text-sm text-ink/65">{user.email ?? 'No email'}</p>
                    {user.phone ? <p className="text-sm text-ink/55">{user.phone}</p> : null}
                    <p className="text-xs text-ink/45">
                        Joined {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {canEdit ? (
                    <button type="button" onClick={onEdit} className={ghostActionClass}>
                        <Pencil size={15} strokeWidth={1.75} />
                        Edit profile
                    </button>
                ) : null}
                {canViewDocuments ? (
                    <Link
                        to={`/clients/documents?space=CUSTOMER&customer=${encodeURIComponent(user.id)}`}
                        className={ghostActionClass}
                    >
                        <FolderOpen size={15} strokeWidth={1.75} />
                        Documents
                    </Link>
                ) : null}
                {canViewQuotations ? (
                    <Link
                        to={`/clients/quotations?customer=${encodeURIComponent(user.id)}`}
                        className={ghostActionClass}
                    >
                        <FileText size={15} strokeWidth={1.75} />
                        Quotations
                    </Link>
                ) : null}
                {canViewPayments ? (
                    <Link
                        to={`/clients/payments?customer=${encodeURIComponent(user.id)}`}
                        className={ghostActionClass}
                    >
                        <Wallet size={15} strokeWidth={1.75} />
                        Payments
                    </Link>
                ) : null}
            </div>
        </div>
    )
}
