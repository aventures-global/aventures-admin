import type { AboutPageContent } from '../../../types/sitePages'
import { FormSection, ListField, MarkdownHint, TextField, TitledListField } from './fields'

type AboutFormProps = {
    value: AboutPageContent
    onChange: (value: AboutPageContent) => void
    showErrors: boolean
}

export default function AboutForm({ value, onChange, showErrors }: AboutFormProps) {
    const whyUs = (patch: Partial<AboutPageContent['whyUs']>) => onChange({ ...value, whyUs: { ...value.whyUs, ...patch } })
    const founder = (patch: Partial<AboutPageContent['founder']>) =>
        onChange({ ...value, founder: { ...value.founder, ...patch } })
    const origin = (patch: Partial<AboutPageContent['origin']>) => onChange({ ...value, origin: { ...value.origin, ...patch } })
    const transparency = (patch: Partial<AboutPageContent['transparency']>) =>
        onChange({ ...value, transparency: { ...value.transparency, ...patch } })
    const contact = (patch: Partial<AboutPageContent['transparency']['contact']>) =>
        transparency({ contact: { ...value.transparency.contact, ...patch } })
    const field = { showErrors }

    return (
        <div className="space-y-5">
            <FormSection title="Page intro" description="Shown above the tabs on every About section.">
                <TextField label="Intro" rows={2} value={value.intro} onChange={(intro) => onChange({ ...value, intro })} maxLength={600} {...field} />
            </FormSection>

            <FormSection title="Why Us tab">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Eyebrow" value={value.whyUs.eyebrow} onChange={(eyebrow) => whyUs({ eyebrow })} maxLength={60} {...field} />
                    <TextField label="Title" value={value.whyUs.title} onChange={(title) => whyUs({ title })} maxLength={160} {...field} />
                </div>
                <TextField label="Intro" rows={3} value={value.whyUs.intro} onChange={(intro) => whyUs({ intro })} maxLength={2000} {...field} />
                <TitledListField label="How we help" itemLabel="Pillar" items={value.whyUs.pillars} onChange={(pillars) => whyUs({ pillars })} {...field} />
                <ListField label="What you can expect" itemLabel="Promise" items={value.whyUs.promise} onChange={(promise) => whyUs({ promise })} {...field} />
                <TextField label="Closing quote" value={value.whyUs.quote} onChange={(quote) => whyUs({ quote })} maxLength={400} {...field} />
            </FormSection>

            <FormSection title="Behind the Dream tab">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Eyebrow" value={value.founder.eyebrow} onChange={(eyebrow) => founder({ eyebrow })} maxLength={60} {...field} />
                    <TextField label="Title" value={value.founder.title} onChange={(title) => founder({ title })} maxLength={160} {...field} />
                    <TextField label="Founder name" value={value.founder.name} onChange={(name) => founder({ name })} maxLength={120} {...field} />
                    <TextField label="Founder role" value={value.founder.role} onChange={(role) => founder({ role })} maxLength={120} {...field} />
                </div>
                <TextField label="Intro" rows={4} value={value.founder.intro} onChange={(intro) => founder({ intro })} maxLength={2000} hint={<MarkdownHint />} {...field} />
                <TextField label="From dreaming to living the dream" rows={4} value={value.founder.story} onChange={(story) => founder({ story })} maxLength={3000} {...field} />
                <TextField label="Why her story matters" rows={4} value={value.founder.whyItMatters} onChange={(whyItMatters) => founder({ whyItMatters })} maxLength={3000} {...field} />
                <TextField label="Quote" rows={2} value={value.founder.quote} onChange={(quote) => founder({ quote })} maxLength={400} {...field} />
            </FormSection>

            <FormSection title="Origin tab">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Eyebrow" value={value.origin.eyebrow} onChange={(eyebrow) => origin({ eyebrow })} maxLength={60} {...field} />
                    <TextField label="Title" value={value.origin.title} onChange={(title) => origin({ title })} maxLength={160} {...field} />
                </div>
                <TextField label="Intro" rows={3} value={value.origin.intro} onChange={(intro) => origin({ intro })} maxLength={2000} {...field} />
                <TextField label="Story" rows={4} value={value.origin.story} onChange={(story) => origin({ story })} maxLength={3000} {...field} />
                <TitledListField label="Values" itemLabel="Value" items={value.origin.values} onChange={(values) => origin({ values })} {...field} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Mission" rows={3} value={value.origin.mission} onChange={(mission) => origin({ mission })} maxLength={600} {...field} />
                    <TextField label="Vision" rows={3} value={value.origin.vision} onChange={(vision) => origin({ vision })} maxLength={600} {...field} />
                </div>
            </FormSection>

            <FormSection title="Trust and Transparency tab">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Eyebrow" value={value.transparency.eyebrow} onChange={(eyebrow) => transparency({ eyebrow })} maxLength={60} {...field} />
                    <TextField label="Title" value={value.transparency.title} onChange={(title) => transparency({ title })} maxLength={160} {...field} />
                </div>
                <TextField label="Intro" rows={3} value={value.transparency.intro} onChange={(intro) => transparency({ intro })} maxLength={2000} {...field} />
                <TextField label="Principle" value={value.transparency.principle} onChange={(principle) => transparency({ principle })} maxLength={300} {...field} />
                <div className="grid gap-4 sm:grid-cols-3">
                    <TextField label="Office address" value={value.transparency.contact.address} onChange={(address) => contact({ address })} maxLength={200} {...field} />
                    <TextField label="Contact email" value={value.transparency.contact.email} onChange={(email) => contact({ email })} maxLength={254} {...field} />
                    <TextField label="Contact phone" value={value.transparency.contact.phone} onChange={(phone) => contact({ phone })} maxLength={40} {...field} />
                </div>
                <ListField label="U.S. visa assistance scope" itemLabel="Visa" items={value.transparency.visas} onChange={(visas) => transparency({ visas })} {...field} />
                <ListField label="What we can help with" itemLabel="Support item" items={value.transparency.support} onChange={(support) => transparency({ support })} {...field} />
                <TextField label="Visa disclaimer" rows={3} value={value.transparency.disclaimer} onChange={(disclaimer) => transparency({ disclaimer })} maxLength={2000} {...field} />
                <TextField label="Footnote" rows={2} value={value.transparency.footnote} onChange={(footnote) => transparency({ footnote })} maxLength={1000} {...field} />
            </FormSection>
        </div>
    )
}
