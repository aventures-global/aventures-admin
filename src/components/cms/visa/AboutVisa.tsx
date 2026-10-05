import { ExternalLink, Lock, SlidersHorizontal } from 'lucide-react'
import { useState, type ElementType } from 'react'
import { Link } from 'react-router-dom'
import { selectClass } from '../../../lib/formStyles'
import type { FaqCategoryOption, ResolvedVisaFaqs } from '../../../lib/visaFaqs'
import { editChip } from '../../../lib/visaStyles'
import type { PublicFaq } from '../../../types/faq'
import type { VisaServiceInput } from '../../../types/visa'

type FaqLinks = Pick<VisaServiceInput, 'faqCategoryId' | 'introFaqId' | 'qualifyFaqId'>

type AboutVisaProps = {
    visaName: string
    links: FaqLinks
    resolved: ResolvedVisaFaqs
    categories: FaqCategoryOption[]
    faqsLoading: boolean
    faqsError: boolean
    preview: boolean
    subHeading: ElementType
    minorHeading: ElementType
    onChange: (links: FaqLinks) => void
}

export default function AboutVisa({
    visaName,
    links,
    resolved,
    categories,
    faqsLoading,
    faqsError,
    preview,
    subHeading: SubHeading,
    minorHeading: MinorHeading,
    onChange,
}: AboutVisaProps) {
    const [choosing, setChoosing] = useState(false)
    const { intro, qualify } = resolved
    const hasAnswers = Boolean(intro || qualify)

    if (preview && !hasAnswers) return null

    return (
        <div className="mt-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
                <SubHeading className="text-xs font-medium uppercase tracking-[0.24em] text-royal">
                    About this visa
                </SubHeading>
                {preview ? null : (
                    <button
                        type="button"
                        aria-expanded={choosing}
                        onClick={() => setChoosing((open) => !open)}
                        className={editChip}
                    >
                        <SlidersHorizontal size={12} strokeWidth={1.75} aria-hidden />
                        {choosing ? 'Done choosing' : 'Choose FAQ answers'}
                    </button>
                )}
            </div>

            {!preview && choosing ? (
                <FaqPicker
                    visaName={visaName}
                    links={links}
                    categories={categories}
                    loading={faqsLoading}
                    error={faqsError}
                    onChange={onChange}
                />
            ) : null}

            {!preview && !hasAnswers ? (
                <p className="mt-3 rounded-[3px] border border-dashed border-royal/25 px-4 py-3 text-sm text-ink/55">
                    {faqsLoading
                        ? 'Loading FAQ answers…'
                        : faqsError
                          ? 'Could not load the FAQs.'
                          : 'No FAQ answers chosen, so this section is hidden on the live page.'}
                </p>
            ) : null}

            {intro ? <AnswerText faq={intro} preview={preview} /> : null}
            {qualify ? (
                <>
                    <MinorHeading className="mt-6 font-noto-serif text-xl text-ink">Who it&rsquo;s for</MinorHeading>
                    <AnswerText faq={qualify} preview={preview} />
                </>
            ) : null}
        </div>
    )
}

function AnswerText({ faq, preview }: { faq: PublicFaq; preview: boolean }) {
    return (
        <p
            title={preview ? undefined : 'This answer comes from the FAQs. Edit it on the FAQs page.'}
            className="mt-3 whitespace-pre-line text-base leading-8 text-ink/75"
        >
            {preview ? null : <Lock size={11} strokeWidth={1.8} className="mr-1.5 inline text-ink/35" aria-hidden />}
            {faq.answer}
        </p>
    )
}

function FaqPicker({
    visaName,
    links,
    categories,
    loading,
    error,
    onChange,
}: {
    visaName: string
    links: FaqLinks
    categories: FaqCategoryOption[]
    loading: boolean
    error: boolean
    onChange: (links: FaqLinks) => void
}) {
    const category = categories.find((c) => c.id === links.faqCategoryId)
    const faqs = category?.faqs ?? []
    const select = `${selectClass} w-full px-2 font-poppins text-sm normal-case tracking-normal`
    const label = 'mb-1 block text-[11px] font-medium text-ink/60'

    return (
        <div className="mt-3 rounded-[3px] border border-royal/15 bg-white/85 p-4 shadow-sm">
            {loading ? (
                <p className="text-sm text-ink/55">Loading FAQs…</p>
            ) : error ? (
                <p className="text-sm text-red-700">Could not load the FAQs. Try reloading the page.</p>
            ) : (
                <div className="grid gap-3 @2xl:grid-cols-3">
                    <label>
                        <span className={label}>FAQ category</span>
                        <select
                            aria-label={`${visaName} FAQ category`}
                            className={select}
                            value={links.faqCategoryId ?? ''}
                            onChange={(event) =>
                                onChange({ faqCategoryId: event.target.value || null, introFaqId: null, qualifyFaqId: null })
                            }
                        >
                            <option value="">None</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className={label}>Introduction answer</span>
                        <select
                            aria-label={`${visaName} introduction FAQ`}
                            className={select}
                            disabled={!category}
                            value={links.introFaqId ?? ''}
                            onChange={(event) => onChange({ ...links, introFaqId: event.target.value || null })}
                        >
                            <option value="">None</option>
                            {faqs.map((faq) => (
                                <option key={faq.id} value={faq.id} disabled={faq.id === links.qualifyFaqId}>
                                    {faq.question}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className={label}>“Who it’s for” answer</span>
                        <select
                            aria-label={`${visaName} who it's for FAQ`}
                            className={select}
                            disabled={!category}
                            value={links.qualifyFaqId ?? ''}
                            onChange={(event) => onChange({ ...links, qualifyFaqId: event.target.value || null })}
                        >
                            <option value="">None</option>
                            {faqs.map((faq) => (
                                <option key={faq.id} value={faq.id} disabled={faq.id === links.introFaqId}>
                                    {faq.question}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
            <p className="mt-3 text-xs text-ink/50">
                The other questions in the category appear under “More questions”. To change the wording,{' '}
                <Link to="/cms/faqs" className="inline-flex items-center gap-1 text-royal hover:text-gold-deep">
                    edit them on the FAQs page <ExternalLink size={11} aria-hidden />
                </Link>
                .
            </p>
        </div>
    )
}
