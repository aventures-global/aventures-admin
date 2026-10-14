import { Check } from 'lucide-react'
import { useState } from 'react'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import { useNotice } from '../../hooks/useNotice'
import { useRolePermissions, useUpdateRolePermissions } from '../../hooks/useSettings'
import { useAuth } from '../../lib/authContext'
import { primaryActionClass } from '../../lib/formStyles'
import type { ConfigurableRole, RolePermissions as RolePermissionsValue } from '../../services/settingsService'
import type { Capability } from '../../services/userService'

const CAPABILITY_INFO: Record<Capability, { label: string; description: string }> = {
    'content.edit': { label: 'Edit website content', description: 'Destinations, FAQs, visa pages, shop, and site pages.' },
    'clients.view': { label: 'View customers', description: 'Customer accounts and their activity.' },
    'clients.edit': { label: 'Edit customer profiles', description: 'Names and phone numbers on customer accounts.' },
    'team.view': { label: 'View team & access', description: 'Team members, invitations, and this permission list.' },
    'business.edit': { label: 'Edit business settings', description: 'Public contact details and social links.' },
}

const ROLES: { role: ConfigurableRole; label: string }[] = [
    { role: 'STAFF', label: 'Staff' },
    { role: 'ADMIN', label: 'Admin' },
]

export default function RolePermissions() {
    const { data, isPending, isError, error } = useRolePermissions()

    return (
        <div>
            <PageHeader
                eyebrow="Settings"
                title="Role permissions"
                description="What each role can do in the admin site. The super admin always has every permission and is the only one who can invite people or change roles."
            />
            {isPending ? (
                <div className="mt-6 h-72 max-w-3xl skeleton-shimmer rounded-[3px]" />
            ) : isError ? (
                <p className="mt-6 text-sm text-red-800">{error.message}</p>
            ) : (
                <PermissionMatrix key={JSON.stringify(data.roles)} value={data} />
            )}
        </div>
    )
}

function PermissionMatrix({ value }: { value: RolePermissionsValue }) {
    const { appUser } = useAuth()
    const editable = appUser?.role === 'SUPER_ADMIN'
    const update = useUpdateRolePermissions()
    const [notice, setNotice] = useNotice()
    const [roles, setRoles] = useState(value.roles)
    const dirty = JSON.stringify(roles) !== JSON.stringify(value.roles)

    const toggle = (role: ConfigurableRole, capability: Capability) =>
        setRoles((prev) => ({
            ...prev,
            [role]: prev[role].includes(capability)
                ? prev[role].filter((item) => item !== capability)
                : [...prev[role], capability],
        }))

    return (
        <div className="mt-6 max-w-3xl space-y-5">
            <Notice notice={notice} />
            <div className="paper-card overflow-x-auto rounded-[3px]">
                <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead className="border-b border-royal/15 bg-cream text-[11px] uppercase tracking-[0.14em] text-ink/55">
                        <tr>
                            <th scope="col" className="px-3 py-2.5 font-normal">Permission</th>
                            {ROLES.map(({ role, label }) => (
                                <th key={role} scope="col" className="w-24 px-3 py-2.5 text-center font-normal">
                                    {label}
                                </th>
                            ))}
                            <th scope="col" className="w-24 px-3 py-2.5 text-center font-normal">Super admin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-royal/10">
                        {value.capabilities.map((capability) => (
                            <tr key={capability}>
                                <td className="px-3 py-2.5">
                                    <p className="text-ink">{CAPABILITY_INFO[capability].label}</p>
                                    <p className="text-xs text-ink/50">{CAPABILITY_INFO[capability].description}</p>
                                </td>
                                {ROLES.map(({ role, label }) => (
                                    <td key={role} className="px-3 py-2.5 text-center">
                                        <input
                                            type="checkbox"
                                            aria-label={`${label}: ${CAPABILITY_INFO[capability].label}`}
                                            checked={roles[role].includes(capability)}
                                            disabled={!editable}
                                            onChange={() => toggle(role, capability)}
                                            className="h-4 w-4 accent-royal disabled:opacity-60"
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-2.5 text-center">
                                    <Check size={16} strokeWidth={1.75} aria-label="Always allowed" className="mx-auto text-gold-deep" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editable ? (
                <div className="flex items-center justify-end gap-3">
                    <p className="text-xs text-ink/45">Changes apply the next time each person loads the admin site.</p>
                    <button
                        type="button"
                        disabled={!dirty || update.isPending}
                        onClick={() =>
                            update.mutate(roles, {
                                onSuccess: () => setNotice({ tone: 'ok', text: 'Permissions saved' }),
                                onError: (err) => setNotice({ tone: 'error', text: err.message }),
                            })
                        }
                        className={primaryActionClass}
                    >
                        {update.isPending ? 'Saving…' : 'Save permissions'}
                    </button>
                </div>
            ) : (
                <p className="text-xs text-ink/45">Only the super admin can change permissions.</p>
            )}
        </div>
    )
}
