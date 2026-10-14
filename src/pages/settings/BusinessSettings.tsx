import { useState, type FormEvent } from 'react'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import { useNotice } from '../../hooks/useNotice'
import { useBusinessSettings, useUpdateBusinessSettings } from '../../hooks/useSettings'
import { useAuth } from '../../lib/authContext'
import { fieldClass, labelClass, primaryActionClass } from '../../lib/formStyles'
import type { BusinessSettings as BusinessSettingsValue } from '../../services/settingsService'

const ADDRESS_LINES = 3

type TextKey = Exclude<keyof BusinessSettingsValue, 'addressLines'>

const SOCIALS: { name: string; url: TextKey; handle: TextKey }[] = [
    { name: 'Facebook', url: 'facebookUrl', handle: 'facebookHandle' },
    { name: 'Instagram', url: 'instagramUrl', handle: 'instagramHandle' },
    { name: 'TikTok', url: 'tiktokUrl', handle: 'tiktokHandle' },
]

export default function BusinessSettings() {
    const { data, isPending, isError, error, refetch } = useBusinessSettings()

    return (
        <div>
            <PageHeader
                eyebrow="Settings"
                title="Business"
                description="Contact details and social links shown in the public site footer, contact sections, and legal pages."
            />
            {isPending ? (
                <div className="mt-6 h-96 max-w-3xl skeleton-shimmer rounded-[3px]" />
            ) : isError ? (
                <div className="mt-6 max-w-3xl rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
                    <p className="text-sm text-red-800">{error.message}</p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="mt-4 text-sm font-medium text-royal transition hover:text-gold-deep"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <BusinessForm key={JSON.stringify(data)} settings={data} />
            )}
        </div>
    )
}

function BusinessForm({ settings }: { settings: BusinessSettingsValue }) {
    const { can } = useAuth()
    const readOnly = !can('business.edit')
    const update = useUpdateBusinessSettings()
    const [notice, setNotice] = useNotice()
    const [form, setForm] = useState<BusinessSettingsValue>(() => ({
        ...settings,
        addressLines: Array.from({ length: ADDRESS_LINES }, (_, i) => settings.addressLines[i] ?? ''),
    }))

    const set = (key: TextKey, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

    const submit = (event: FormEvent) => {
        event.preventDefault()
        update.mutate(
            { ...form, addressLines: form.addressLines.map((line) => line.trim()).filter(Boolean) },
            {
                onSuccess: () => setNotice({ tone: 'ok', text: 'Business settings saved' }),
                onError: (err) => setNotice({ tone: 'error', text: err.message }),
            },
        )
    }

    const field = (key: TextKey, label: string, type = 'text') => (
        <div>
            <label htmlFor={`business-${key}`} className={labelClass}>
                {label}
            </label>
            <input
                id={`business-${key}`}
                type={type}
                value={form[key]}
                onChange={(event) => set(key, event.target.value)}
                className={`${fieldClass} disabled:opacity-70`}
            />
        </div>
    )

    return (
        <form onSubmit={submit} className="mt-6 max-w-3xl space-y-5">
            <Notice notice={notice} />
            {readOnly ? (
                <p className="text-sm text-ink/60">You can view these details. Ask an admin to change them.</p>
            ) : null}

            <fieldset disabled={readOnly} className="space-y-5">
                <section className="paper-card space-y-4 rounded-[3px] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Contact</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {field('email', 'Public email', 'email')}
                        {field('phoneDisplay', 'Phone', 'tel')}
                    </div>
                </section>

                <section className="paper-card space-y-4 rounded-[3px] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Office address</p>
                    {form.addressLines.map((line, index) => (
                        <div key={index}>
                            <label htmlFor={`business-address-${index}`} className={labelClass}>
                                Line {index + 1}
                            </label>
                            <input
                                id={`business-address-${index}`}
                                value={line}
                                maxLength={120}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        addressLines: prev.addressLines.map((item, i) =>
                                            i === index ? event.target.value : item,
                                        ),
                                    }))
                                }
                                className={`${fieldClass} disabled:opacity-70`}
                            />
                        </div>
                    ))}
                </section>

                <section className="paper-card space-y-4 rounded-[3px] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Social media</p>
                    {SOCIALS.map((social) => (
                        <div key={social.name} className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                            {field(social.url, `${social.name} link`, 'url')}
                            {field(social.handle, `${social.name} handle`)}
                        </div>
                    ))}
                    <p className="text-xs text-ink/45">Leave a link empty to hide that network.</p>
                </section>
            </fieldset>

            {readOnly ? null : (
                <div className="flex justify-end">
                    <button type="submit" disabled={update.isPending} className={primaryActionClass}>
                        {update.isPending ? 'Saving…' : 'Save business settings'}
                    </button>
                </div>
            )}
        </form>
    )
}
