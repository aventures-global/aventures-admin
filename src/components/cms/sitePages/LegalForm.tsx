import type { LegalPageContent, LegalSectionContent } from '../../../types/sitePages'
import { moveItem } from '../../../lib/listOps'
import AddItemButton from '../AddItemButton'
import ItemControls from '../ItemControls'
import { FormSection, MarkdownHint, TextField } from './fields'

type LegalFormProps = {
    value: LegalPageContent
    onChange: (value: LegalPageContent) => void
    showErrors: boolean
    /** Section ids with extra content the public site adds on its own. */
    fixedNotes?: Record<string, string>
}

export default function LegalForm({ value, onChange, showErrors, fixedNotes = {} }: LegalFormProps) {
    const sections = value.sections
    const setSections = (next: LegalSectionContent[]) => onChange({ ...value, sections: next })
    const updateSection = (index: number, patch: Partial<LegalSectionContent>) =>
        setSections(sections.map((section, i) => (i === index ? { ...section, ...patch } : section)))

    return (
        <div className="space-y-5">
            <FormSection title="Page header">
                <TextField label="Subtitle" value={value.subtitle} onChange={(subtitle) => onChange({ ...value, subtitle })} maxLength={200} showErrors={showErrors} />
                <TextField label="Intro" rows={4} value={value.intro} onChange={(intro) => onChange({ ...value, intro })} maxLength={4000} hint={<MarkdownHint />} showErrors={showErrors} />
                <TextField
                    label="Last updated"
                    value={value.lastUpdated}
                    onChange={(lastUpdated) => onChange({ ...value, lastUpdated })}
                    maxLength={40}
                    hint="Shown at the bottom of the page, e.g. 4 October 2026. Update it when the policy changes."
                    showErrors={showErrors}
                />
            </FormSection>

            {sections.map((section, index) => (
                <section key={index} className="paper-card space-y-4 rounded-[3px] p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-noto-serif text-lg text-royal">
                            <span className="mr-2 text-sm tabular-nums text-ink/40">{index + 1}</span>
                            {section.title || 'New section'}
                        </h2>
                        <ItemControls
                            tone="light"
                            index={index}
                            count={sections.length}
                            label={`section ${index + 1}`}
                            canRemove={sections.length > 1}
                            onMove={(from, to) => setSections(moveItem(sections, from, to))}
                            onRemove={(i) => setSections(sections.filter((_, j) => j !== i))}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                        <TextField label="Label" value={section.label} onChange={(label) => updateSection(index, { label })} maxLength={60} showErrors={showErrors} />
                        <TextField label="Title" value={section.title} onChange={(title) => updateSection(index, { title })} maxLength={160} showErrors={showErrors} />
                    </div>
                    <TextField label="Body" rows={8} value={section.body} onChange={(body) => updateSection(index, { body })} maxLength={10000} hint={<MarkdownHint />} showErrors={showErrors} />
                    <TextField
                        label="Anchor"
                        optional
                        value={section.id}
                        onChange={(id) => updateSection(index, { id })}
                        maxLength={60}
                        hint={`Links to this section use #${section.id || 'anchor'}. Leave blank to make one from the title.`}
                    />
                    {fixedNotes[section.id] ? (
                        <p className="rounded-[3px] border border-royal/15 bg-royal/[0.03] px-3 py-2 text-xs text-ink/60">
                            {fixedNotes[section.id]}
                        </p>
                    ) : null}
                </section>
            ))}

            <AddItemButton
                tone="light"
                label="Add section"
                onClick={() => setSections([...sections, { id: '', label: '', title: '', body: '' }])}
            />
        </div>
    )
}
