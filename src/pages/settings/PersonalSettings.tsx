import { useRef } from 'react'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import RoleBadge from '../../components/settings/RoleBadge'
import UserProfileForm from '../../components/settings/UserProfileForm'
import { IMAGE_ACCEPT, useImageUpload } from '../../hooks/useImageUpload'
import { useNotice } from '../../hooks/useNotice'
import { useUpdateMe } from '../../hooks/useSettings'
import { useAuth } from '../../lib/authContext'
import { ghostActionClass } from '../../lib/formStyles'

export default function PersonalSettings() {
    const { appUser, displayName, refresh } = useAuth()
    const [notice, setNotice] = useNotice()
    const updateMe = useUpdateMe()
    const avatar = useImageUpload('avatars')
    const fileRef = useRef<HTMLInputElement>(null)

    if (!appUser) return null

    const save = (input: Parameters<typeof updateMe.mutate>[0], text: string) =>
        updateMe.mutate(input, {
            onSuccess: () => {
                setNotice({ tone: 'ok', text })
                void refresh()
            },
            onError: (err) => setNotice({ tone: 'error', text: err.message }),
        })

    const pickAvatar = async (file: File | undefined) => {
        if (!file) return
        const url = await avatar.upload(file)
        if (url) save({ profilePicture: url }, 'Photo updated')
    }

    return (
        <div>
            <PageHeader
                eyebrow="Settings"
                title="Personal"
                description="Your own details, shown to the team wherever your name appears."
                actions={<RoleBadge role={appUser.role} />}
            />

            <div className="mt-6 max-w-3xl space-y-5">
                <Notice notice={notice} />
                {avatar.error ? <Notice notice={{ tone: 'error', text: avatar.error }} /> : null}

                <UserProfileForm
                    key={appUser.updatedAt}
                    user={appUser}
                    saving={updateMe.isPending}
                    onSave={(input) => save(input, 'Profile saved')}
                    note="Your email and password are managed through your sign-in account."
                >
                    <div className="flex items-center gap-4">
                        {appUser.profilePicture ? (
                            <img
                                src={appUser.profilePicture}
                                alt=""
                                className="h-16 w-16 rounded-full border border-royal/15 object-cover"
                            />
                        ) : (
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-royal font-noto-serif text-xl text-cream">
                                {displayName.slice(0, 1).toUpperCase()}
                            </span>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={avatar.isUploading || updateMe.isPending}
                                onClick={() => fileRef.current?.click()}
                                className={ghostActionClass}
                            >
                                {avatar.isUploading ? 'Uploading…' : 'Change photo'}
                            </button>
                            {appUser.profilePicture ? (
                                <button
                                    type="button"
                                    disabled={updateMe.isPending}
                                    onClick={() => save({ profilePicture: null }, 'Photo removed')}
                                    className={ghostActionClass}
                                >
                                    Remove
                                </button>
                            ) : null}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept={IMAGE_ACCEPT}
                            hidden
                            onChange={(event) => {
                                void pickAvatar(event.target.files?.[0])
                                event.target.value = ''
                            }}
                        />
                    </div>
                </UserProfileForm>
            </div>
        </div>
    )
}
