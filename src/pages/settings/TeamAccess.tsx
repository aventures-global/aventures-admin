import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import Notice from '../../components/cms/faqs/Notice'
import InviteDialog from '../../components/settings/InviteDialog'
import PendingInvitations from '../../components/settings/PendingInvitations'
import UserDirectory from '../../components/settings/UserDirectory'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import { primaryActionClass } from '../../lib/formStyles'
import { TEAM_ROLES } from '../../lib/roles'

export default function TeamAccess() {
    const navigate = useNavigate()
    const { appUser } = useAuth()
    const [notice, setNotice] = useNotice()
    const [inviting, setInviting] = useState(false)
    const isSuperAdmin = appUser?.role === 'SUPER_ADMIN'

    return (
        <div>
            <PageHeader
                eyebrow="Settings"
                title="Team & access"
                description={
                    isSuperAdmin
                        ? 'Staff and admins who can sign in to this site. To add someone, search their website account and send an invitation.'
                        : 'Staff and admins who can sign in to this site. Only the super admin can invite people or change roles.'
                }
                actions={
                    isSuperAdmin ? (
                        <button type="button" onClick={() => setInviting(true)} className={primaryActionClass}>
                            <UserPlus size={15} strokeWidth={1.6} aria-hidden />
                            Invite
                        </button>
                    ) : null
                }
            />

            <div className="mt-6 max-w-5xl space-y-8">
                <Notice notice={notice} />

                <section>
                    <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-royal">Pending invitations</h2>
                    <PendingInvitations
                        canManage={isSuperAdmin}
                        onError={(text) => setNotice({ tone: 'error', text })}
                    />
                </section>

                <section>
                    <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-royal">Team members</h2>
                    <UserDirectory
                        scope="team"
                        roles={TEAM_ROLES}
                        emptyTitle="No team members found"
                        emptyBody="Invited people appear here once they accept."
                        onSelect={(user) => navigate(user.id)}
                    />
                </section>
            </div>

            <InviteDialog open={inviting} onClose={() => setInviting(false)} />
        </div>
    )
}
