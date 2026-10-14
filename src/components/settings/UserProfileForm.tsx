import { useState, type FormEvent, type ReactNode } from 'react'
import { fieldClass, labelClass, primaryActionClass } from '../../lib/formStyles'
import type { AppUser, ProfileInput } from '../../services/userService'

type UserProfileFormProps = {
    user: AppUser
    readOnly?: boolean
    saving: boolean
    onSave: (input: ProfileInput) => void
    note?: ReactNode
    /** Rendered above the fields, e.g. the avatar picker on Personal settings. */
    children?: ReactNode
}

export default function UserProfileForm({ user, readOnly = false, saving, onSave, note, children }: UserProfileFormProps) {
    const [form, setForm] = useState({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
    })

    const submit = (event: FormEvent) => {
        event.preventDefault()
        onSave({
            firstName: form.firstName.trim() || null,
            lastName: form.lastName.trim() || null,
            phone: form.phone.trim() || null,
        })
    }

    return (
        <form onSubmit={submit} className="paper-card space-y-4 rounded-[3px] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Profile</p>
            {children}
            <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor={`${user.id}-first-name`} className={labelClass}>
                        First name
                    </label>
                    <input
                        id={`${user.id}-first-name`}
                        value={form.firstName}
                        maxLength={100}
                        onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                        className={`${fieldClass} disabled:opacity-70`}
                    />
                </div>
                <div>
                    <label htmlFor={`${user.id}-last-name`} className={labelClass}>
                        Last name
                    </label>
                    <input
                        id={`${user.id}-last-name`}
                        value={form.lastName}
                        maxLength={100}
                        onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                        className={`${fieldClass} disabled:opacity-70`}
                    />
                </div>
                <div>
                    <label htmlFor={`${user.id}-phone`} className={labelClass}>
                        Phone
                    </label>
                    <input
                        id={`${user.id}-phone`}
                        type="tel"
                        value={form.phone}
                        maxLength={40}
                        onChange={(event) => setForm({ ...form, phone: event.target.value })}
                        className={`${fieldClass} disabled:opacity-70`}
                    />
                </div>
                <div>
                    <p className={labelClass}>Email</p>
                    <p className="py-2 text-sm text-ink/60">{user.email ?? '—'}</p>
                </div>
            </fieldset>
            {note ? <p className="text-xs text-ink/45">{note}</p> : null}
            {readOnly ? null : (
                <div className="flex justify-end">
                    <button type="submit" disabled={saving} className={primaryActionClass}>
                        {saving ? 'Saving…' : 'Save profile'}
                    </button>
                </div>
            )}
        </form>
    )
}
