import type { HomePageContent } from '../../../types/sitePages'
import { FormSection, ListField, TextField } from './fields'

type HomeFormProps = {
    value: HomePageContent
    onChange: (value: HomePageContent) => void
    showErrors: boolean
}

export default function HomeForm({ value, onChange, showErrors }: HomeFormProps) {
    const hero = (patch: Partial<HomePageContent['hero']>) => onChange({ ...value, hero: { ...value.hero, ...patch } })
    const story = (patch: Partial<HomePageContent['story']>) => onChange({ ...value, story: { ...value.story, ...patch } })
    const whyUs = (patch: Partial<HomePageContent['whyUs']>) => onChange({ ...value, whyUs: { ...value.whyUs, ...patch } })

    return (
        <div className="space-y-5">
            <FormSection title="Hero" description="The full-screen opening image. The button always links to Start Your AVENture.">
                <TextField label="Title" value={value.hero.title} onChange={(title) => hero({ title })} maxLength={80} showErrors={showErrors} hint="Shown in capitals on one line, so keep it short." />
                <TextField label="Subtitle" value={value.hero.subtitle} onChange={(subtitle) => hero({ subtitle })} maxLength={200} showErrors={showErrors} />
                <TextField label="Button label" value={value.hero.ctaLabel} onChange={(ctaLabel) => hero({ ctaLabel })} maxLength={60} showErrors={showErrors} />
            </FormSection>

            <FormSection title="The AVENTURES Story" description="Short introduction that links to the About page.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Eyebrow" value={value.story.eyebrow} onChange={(eyebrow) => story({ eyebrow })} maxLength={60} showErrors={showErrors} />
                    <TextField label="Title" value={value.story.title} onChange={(title) => story({ title })} maxLength={160} showErrors={showErrors} />
                </div>
                <TextField label="Body" rows={4} value={value.story.body} onChange={(body) => story({ body })} maxLength={2000} showErrors={showErrors} />
                <TextField label="Link label" value={value.story.linkLabel} onChange={(linkLabel) => story({ linkLabel })} maxLength={60} showErrors={showErrors} />
            </FormSection>

            <FormSection title="Why AVENTURES?" description="The blue band listing reasons to travel with AVENTURES.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Eyebrow" value={value.whyUs.eyebrow} onChange={(eyebrow) => whyUs({ eyebrow })} maxLength={60} showErrors={showErrors} />
                    <TextField label="Title" value={value.whyUs.title} onChange={(title) => whyUs({ title })} maxLength={160} showErrors={showErrors} />
                </div>
                <ListField label="Points" itemLabel="Point" items={value.whyUs.points} onChange={(points) => whyUs({ points })} showErrors={showErrors} />
            </FormSection>
        </div>
    )
}
