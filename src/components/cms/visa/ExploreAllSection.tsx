import { ArrowRight } from 'lucide-react'
import { lightEdit } from '../../../lib/visaStyles'
import type { VisaFinder, VisaId } from '../../../types/visa'
import EditableText from '../EditableText'
import type { FinderServiceView } from './FinderCard'
import { FixedBadge } from './VisaEditorParts'

const arrowClass = 'shrink-0 text-royal/30'

type ExploreAllSectionProps = {
    finder: VisaFinder
    services: FinderServiceView[]
    recommended: VisaId | null
    preview: boolean
    onCategoryChange: (visa: VisaId, category: string) => void
    onFinderChange: (finder: VisaFinder) => void
}

export default function ExploreAllSection({
    finder,
    services,
    recommended,
    preview,
    onCategoryChange,
    onFinderChange,
}: ExploreAllSectionProps) {
    const setLink = (id: string, patch: { label?: string; note?: string }) =>
        onFinderChange({
            ...finder,
            exploreLinks: finder.exploreLinks.map((link) => (link.id === id ? { ...link, ...patch } : link)),
        })

    return (
        <section aria-label="Explore all services" className="mx-auto max-w-5xl">
            <div className="text-center">
                {preview ? null : (
                    <div className="mb-3">
                        <FixedBadge title="This heading is the same on every visit." />
                    </div>
                )}
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#9b7512]">Visa services</p>
                <h2 className="mt-2 font-noto-serif text-2xl text-ink @2xl:text-3xl">Explore All AVENTURES Services</h2>
                <p className="mx-auto mt-4 max-w-xl text-balance font-noto-serif text-lg italic leading-relaxed text-ink/70">
                    Answer a few questions. Find your direction. Start your AVENture.
                </p>
            </div>
            <ul className="mt-10 grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
                {services.map((service) => {
                    const isRecommended = service.id === recommended
                    return (
                        <li key={service.id} className="flex">
                            <div
                                className={`relative flex h-full w-full flex-col rounded-[3px] border border-royal/15 bg-cream px-5 py-6 ${
                                    isRecommended ? 'border-l-2 border-l-[#9b7512]' : ''
                                }`}
                            >
                                <EditableText
                                    as="span"
                                    readOnly={preview}
                                    className="block pr-6 text-[10px] font-medium uppercase tracking-[0.22em] text-[#9b7512]"
                                    editClassName={lightEdit}
                                    value={service.category}
                                    label={`${service.title} card category`}
                                    placeholder="Category"
                                    invalid={!service.category.trim()}
                                    onChange={(value) => onCategoryChange(service.id, value)}
                                />
                                {isRecommended ? (
                                    <span className="mt-2 pr-6 text-[10px] font-medium uppercase tracking-[0.18em] text-[#9b7512]">
                                        Suggested for you
                                    </span>
                                ) : null}
                                <span
                                    className="mt-3 pr-6 font-noto-serif text-lg leading-snug text-royal @2xl:text-xl"
                                    title={preview ? undefined : 'Edited on the visa’s service page'}
                                >
                                    {service.title}
                                </span>
                                <span className="mt-2.5 text-sm leading-6 text-ink/60">{service.description}</span>
                                <ArrowRight
                                    aria-hidden="true"
                                    size={15}
                                    strokeWidth={1.5}
                                    className={`absolute top-6 right-5 ${arrowClass}`}
                                />
                            </div>
                        </li>
                    )
                })}
            </ul>
            <ul className="mt-12 grid gap-4 @2xl:grid-cols-2">
                {finder.exploreLinks.map((link) => (
                    <li key={link.id} className="flex">
                        <div className="flex h-full w-full items-center justify-between gap-6 rounded-[3px] border border-royal/10 bg-white px-6 py-5">
                            <span className="min-w-0 flex-1">
                                <EditableText
                                    as="span"
                                    readOnly={preview}
                                    className="block font-noto-serif text-lg leading-snug text-ink"
                                    editClassName={lightEdit}
                                    value={link.label}
                                    label="Link title"
                                    placeholder="Link title"
                                    invalid={!link.label.trim()}
                                    onChange={(label) => setLink(link.id, { label })}
                                />
                                <EditableText
                                    as="span"
                                    readOnly={preview}
                                    className="mt-1.5 block text-sm leading-6 text-ink/55"
                                    editClassName={lightEdit}
                                    value={link.note}
                                    label="Link note"
                                    placeholder="Short note"
                                    invalid={!link.note.trim()}
                                    onChange={(note) => setLink(link.id, { note })}
                                />
                            </span>
                            <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} className={arrowClass} />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}
