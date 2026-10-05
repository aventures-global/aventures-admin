import { Download, Loader2, Upload, X } from 'lucide-react'
import { useRef, useState, type ElementType } from 'react'
import { lightEdit, editChip, visaSecondaryButton } from '../../../lib/visaStyles'
import { uploadPdf } from '../../../services/uploadService'
import type { VisaChecklist, VisaService } from '../../../types/visa'
import AddItemButton from '../AddItemButton'
import EditableText from '../EditableText'
import ItemControls from '../ItemControls'

type ChecklistBoxProps = {
    visaName: string
    checklist: VisaChecklist
    pdf: VisaService['checklistPdf']
    preview: boolean
    subHeading: ElementType
    minorHeading: ElementType
    onChange: (checklist: VisaChecklist) => void
    onPdfChange: (pdf: VisaService['checklistPdf']) => void
}

export default function ChecklistBox({
    visaName,
    checklist,
    pdf,
    preview,
    subHeading: SubHeading,
    minorHeading: MinorHeading,
    onChange,
    onPdfChange,
}: ChecklistBoxProps) {
    const [justAdded, setJustAdded] = useState<string | null>(null)
    const groups = checklist.groups

    const setGroups = (next: VisaChecklist['groups']) => onChange({ ...checklist, groups: next })
    const setGroup = (index: number, patch: Partial<VisaChecklist['groups'][number]>) =>
        setGroups(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)))

    const moveGroup = (from: number, to: number) => {
        if (to < 0 || to >= groups.length) return
        const next = [...groups]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        setGroups(next)
    }

    const setItem = (groupIndex: number, itemIndex: number, value: string) =>
        setGroup(groupIndex, { items: groups[groupIndex].items.map((item, i) => (i === itemIndex ? value : item)) })

    const removeItem = (groupIndex: number, itemIndex: number) =>
        setGroup(groupIndex, { items: groups[groupIndex].items.filter((_, i) => i !== itemIndex) })

    const addItem = (groupIndex: number) => {
        setGroup(groupIndex, { items: [...groups[groupIndex].items, ''] })
        setJustAdded(`${groupIndex}-${groups[groupIndex].items.length}`)
    }

    const addGroup = () => {
        setGroups([...groups, { title: '', items: [''] }])
        setJustAdded(`${groups.length}-title`)
    }

    return (
        <div className="mt-12 border border-royal/15 bg-white/60 px-6 py-8 @2xl:px-10 @2xl:py-10">
            <SubHeading className="text-xs font-medium uppercase tracking-[0.24em] text-royal">
                What you&rsquo;ll prepare
            </SubHeading>
            <EditableText
                readOnly={preview}
                className="mt-3 font-noto-serif text-2xl text-ink @2xl:text-[1.7rem]"
                editClassName={lightEdit}
                value={checklist.tagline}
                label={`${visaName} checklist tagline`}
                placeholder="A one-line summary of what to prepare"
                invalid={!checklist.tagline.trim()}
                onChange={(tagline) => onChange({ ...checklist, tagline })}
            />
            {!preview || checklist.intro ? (
                <EditableText
                    readOnly={preview}
                    multiline
                    className="mt-3 max-w-2xl text-sm leading-7 text-ink/65"
                    editClassName={lightEdit}
                    value={checklist.intro}
                    label={`${visaName} checklist introduction`}
                    placeholder="Optional introduction"
                    onChange={(intro) => onChange({ ...checklist, intro })}
                />
            ) : null}

            <div className="mt-8 grid gap-x-12 gap-y-8 @3xl:grid-cols-2">
                {groups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        <div className="flex items-start gap-2 border-b border-royal/15 pb-2">
                            <MinorHeading className="min-w-0 flex-1 text-sm font-semibold uppercase tracking-[0.12em] text-royal">
                                <EditableText
                                    as="span"
                                    readOnly={preview}
                                    className="block"
                                    editClassName={lightEdit}
                                    value={group.title}
                                    label={`Checklist group ${groupIndex + 1} title`}
                                    placeholder="Group title"
                                    invalid={!group.title.trim()}
                                    autoEdit={justAdded === `${groupIndex}-title`}
                                    onEditEnd={() => setJustAdded(null)}
                                    onChange={(title) => setGroup(groupIndex, { title })}
                                />
                            </MinorHeading>
                            {preview ? null : (
                                <ItemControls
                                    tone="light"
                                    index={groupIndex}
                                    count={groups.length}
                                    label={`group “${group.title || groupIndex + 1}”`}
                                    canRemove={groups.length > 1}
                                    onMove={moveGroup}
                                    onRemove={(index) => setGroups(groups.filter((_, i) => i !== index))}
                                    className="-mt-1 scale-90"
                                />
                            )}
                        </div>
                        <ul className="mt-3 space-y-2">
                            {group.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="group/item flex gap-3 text-sm leading-6 text-ink/75">
                                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold-deep" />
                                    <EditableText
                                        as="span"
                                        readOnly={preview}
                                        className="min-w-0 flex-1"
                                        editClassName={lightEdit}
                                        value={item}
                                        label={`Checklist item in ${group.title || 'this group'}`}
                                        placeholder="Checklist item"
                                        autoEdit={justAdded === `${groupIndex}-${itemIndex}`}
                                        onEditEnd={(value) => {
                                            setJustAdded(null)
                                            if (!value.trim()) removeItem(groupIndex, itemIndex)
                                        }}
                                        onChange={(value) => setItem(groupIndex, itemIndex, value)}
                                    />
                                    {preview ? null : (
                                        <button
                                            type="button"
                                            aria-label={`Remove “${item || 'empty item'}”`}
                                            title="Remove item"
                                            onClick={() => removeItem(groupIndex, itemIndex)}
                                            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-ink/35 opacity-0 transition hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100 group-hover/item:opacity-100"
                                        >
                                            <X size={13} strokeWidth={1.75} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {preview ? null : (
                            <button
                                type="button"
                                onClick={() => addItem(groupIndex)}
                                className="mt-2 ml-[1.125rem] text-xs text-royal/60 transition hover:text-royal"
                            >
                                + Add item
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {preview ? null : (
                <AddItemButton tone="light" label="Add checklist group" onClick={addGroup} className="mt-6" />
            )}

            <div className="mt-10 border-l-2 border-gold-deep bg-royal/[0.04] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-royal">Important reminder</p>
                <EditableText
                    readOnly={preview}
                    multiline
                    className="mt-2 text-sm leading-7 text-ink/70"
                    editClassName={lightEdit}
                    value={checklist.reminder}
                    label={`${visaName} checklist reminder`}
                    placeholder="A reminder shown under the checklist"
                    invalid={!checklist.reminder.trim()}
                    onChange={(reminder) => onChange({ ...checklist, reminder })}
                />
            </div>

            <PdfDownload pdf={pdf} preview={preview} visaName={visaName} onChange={onPdfChange} />
        </div>
    )
}

function PdfDownload({
    pdf,
    preview,
    visaName,
    onChange,
}: {
    pdf: VisaService['checklistPdf']
    preview: boolean
    visaName: string
    onChange: (pdf: VisaService['checklistPdf']) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const upload = async (file: File) => {
        setError(null)
        setUploading(true)
        try {
            const href = await uploadPdf(file)
            const downloadName = pdf.downloadName || file.name
            onChange({ href, downloadName })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not upload the PDF')
        } finally {
            setUploading(false)
        }
    }

    const button = (
        <span className={`${visaSecondaryButton} mt-8`}>
            <Download size={16} aria-hidden />
            Download the printable checklist (PDF)
        </span>
    )

    if (preview) {
        return pdf.href ? (
            <a href={pdf.href} download={pdf.downloadName} target="_blank" rel="noreferrer" className="inline-block">
                {button}
            </a>
        ) : (
            button
        )
    }

    return (
        <div>
            {button}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/55">
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                    className={editChip}
                >
                    {uploading ? (
                        <Loader2 size={12} className="animate-spin" aria-hidden />
                    ) : (
                        <Upload size={12} strokeWidth={1.75} aria-hidden />
                    )}
                    {uploading ? 'Uploading…' : pdf.href ? 'Replace PDF' : 'Upload PDF'}
                </button>
                {pdf.href ? (
                    <a href={pdf.href} target="_blank" rel="noreferrer" className={editChip}>
                        Open current PDF
                    </a>
                ) : (
                    <span className="text-red-700">No PDF yet</span>
                )}
                <span className="inline-flex items-center gap-1">
                    Saves as
                    <EditableText
                        as="span"
                        className="font-medium text-ink/75"
                        editClassName={lightEdit}
                        value={pdf.downloadName}
                        label={`${visaName} PDF file name`}
                        placeholder="file-name.pdf"
                        invalid={!pdf.downloadName.trim()}
                        onChange={(downloadName) => onChange({ ...pdf, downloadName })}
                    />
                </span>
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ''
                        if (file) void upload(file)
                    }}
                />
            </div>
            {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
        </div>
    )
}
