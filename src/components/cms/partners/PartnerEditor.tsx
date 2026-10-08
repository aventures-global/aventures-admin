import { useState, type FormEvent } from 'react'
import { fieldClass, labelClass } from '../../../lib/formStyles'
import type { PartnerInput } from '../../../services/partnerService'
import EditableImage from '../EditableImage'

type PartnerEditorProps = {
    initial?: PartnerInput
    submitLabel: string
    busy: boolean
    onSubmit: (input: PartnerInput) => void
    onCancel: () => void
}

const EMPTY: PartnerInput = { name: '', url: '', description: '', logoSrc: '' }

function isWebUrl(value: string) {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
        return false
    }
}

export default function PartnerEditor({
    initial = EMPTY,
    submitLabel,
    busy,
    onSubmit,
    onCancel,
}: PartnerEditorProps) {
    const [name, setName] = useState(initial.name)
    const [url, setUrl] = useState(initial.url)
    const [description, setDescription] = useState(initial.description)
    const [logoSrc, setLogoSrc] = useState(initial.logoSrc)
    const urlInvalid = url.trim().length > 0 && !isWebUrl(url.trim())
    const canSave = name.trim().length > 0 && isWebUrl(url.trim())

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (!canSave) return
        onSubmit({ name: name.trim(), url: url.trim(), description: description.trim(), logoSrc })
    }

    return (
        <form
            onSubmit={submit}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && !busy) onCancel()
            }}
            className="space-y-4"
        >
            <div>
                <p className={labelClass}>Logo</p>
                <EditableImage
                    src={logoSrc}
                    alt={name ? `${name} logo` : 'Partner logo'}
                    onChange={setLogoSrc}
                    label="Logo"
                    folder="partners"
                    className="relative h-28 w-full max-w-xs overflow-hidden rounded-[3px] border border-royal/15 bg-white"
                    imgClassName="object-contain p-3"
                    buttonClassName="bottom-2 right-2"
                />
                <div className="mt-1 flex items-center gap-3 text-xs text-ink/50">
                    <p>Until a logo is added, the site shows the partner’s initials.</p>
                    {logoSrc ? (
                        <button
                            type="button"
                            onClick={() => setLogoSrc('')}
                            className="text-red-700/80 transition hover:text-red-800"
                        >
                            Remove logo
                        </button>
                    ) : null}
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass} htmlFor="partner-name">
                        Partner name
                    </label>
                    <input
                        id="partner-name"
                        autoFocus
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={120}
                        placeholder="REK Global Philippines"
                        className={fieldClass}
                    />
                </div>
                <div>
                    <label className={labelClass} htmlFor="partner-url">
                        Website
                    </label>
                    <input
                        id="partner-url"
                        type="url"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        maxLength={300}
                        placeholder="https://example.com"
                        aria-invalid={urlInvalid}
                        className={fieldClass}
                    />
                    {urlInvalid ? (
                        <p className="mt-1 text-xs text-red-700">Enter a full address starting with https://</p>
                    ) : null}
                </div>
            </div>
            <div>
                <label className={labelClass} htmlFor="partner-description">
                    Description
                </label>
                <textarea
                    id="partner-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    maxLength={300}
                    className={`${fieldClass} min-h-20 resize-y leading-relaxed`}
                />
                <p className="mt-1 text-xs text-ink/50">One or two sentences shown under the name on the homepage.</p>
            </div>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    className="rounded-[3px] border border-royal/25 px-3.5 py-1.5 text-sm text-ink/75 transition hover:border-royal hover:text-royal disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!canSave || busy}
                    className="btn-royal rounded-[3px] px-3.5 py-1.5 text-sm disabled:opacity-60"
                >
                    {busy ? 'Saving…' : submitLabel}
                </button>
            </div>
        </form>
    )
}
