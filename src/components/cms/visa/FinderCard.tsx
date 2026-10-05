import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { selectClass } from '../../../lib/formStyles'
import { withNewOption } from '../../../lib/visaDraft'
import { lightEdit, visaPrimaryButton, visaQuietLink, visaSecondaryButton } from '../../../lib/visaStyles'
import type { FinderOption, PathId, Readiness, VisaFinder, VisaId, VisaService } from '../../../types/visa'
import AddItemButton from '../AddItemButton'
import EditableText from '../EditableText'
import ItemControls from '../ItemControls'
import { FixedBadge } from './VisaEditorParts'

export type FinderStep =
    | { kind: 'intro' }
    | { kind: 'purpose' }
    | { kind: 'role'; path: PathId }
    | { kind: 'readiness'; visa: VisaId }
    | { kind: 'result'; visa: VisaId; readiness: Readiness }
    | { kind: 'unsure' }

export type FinderServiceView = Pick<VisaService, 'id' | 'title' | 'description' | 'shortLabel' | 'category'>

const TOTAL_QUESTIONS = 3
const MAX_ROLE_ANSWERS = 12

type FinderCardProps = {
    finder: VisaFinder
    services: FinderServiceView[]
    step: FinderStep
    preview: boolean
    onGo: (next: FinderStep) => void
    onBack: () => void
    onStartOver: () => void
    onFinderChange: (finder: VisaFinder) => void
    onShortLabelChange: (visa: VisaId, shortLabel: string) => void
}

export default function FinderCard({
    finder,
    services,
    step,
    preview,
    onGo,
    onBack,
    onStartOver,
    onFinderChange,
    onShortLabelChange,
}: FinderCardProps) {
    const isIntro = step.kind === 'intro'
    const set = (patch: Partial<VisaFinder>) => onFinderChange({ ...finder, ...patch })

    let body: ReactNode
    if (step.kind === 'intro') {
        body = (
            <div>
                <p className="mt-3 text-sm leading-7 text-ink/60">Three questions, or browse every service below.</p>
                <button type="button" onClick={() => onGo({ kind: 'purpose' })} className={`${visaPrimaryButton} mt-5 w-full`}>
                    Start
                    <ArrowRight size={17} />
                </button>
            </div>
        )
    } else if (step.kind === 'purpose') {
        const question = finder.purpose
        const nextFor = (id: string): FinderStep => {
            const path = question.options.find((o) => o.id === id)?.path
            return path ? { kind: 'role', path } : { kind: 'unsure' }
        }
        body = (
            <QuestionStep
                number={1}
                title={question.title}
                preview={preview}
                onTitle={(title) => set({ purpose: { ...question, title } })}
                onBack={onBack}
            >
                {question.options.map((option) => (
                    <Answer
                        key={option.id}
                        label={option.label}
                        preview={preview}
                        onChoose={() => onGo(nextFor(option.id))}
                        onLabel={(label) =>
                            set({
                                purpose: {
                                    ...question,
                                    options: question.options.map((o) => (o.id === option.id ? { ...o, label } : o)),
                                },
                            })
                        }
                    />
                ))}
            </QuestionStep>
        )
    } else if (step.kind === 'role') {
        const path = step.path
        const question = finder.roles[path]
        const setQuestion = (next: typeof question) => set({ roles: { ...finder.roles, [path]: next } })
        const setOptions = (options: FinderOption[]) => setQuestion({ ...question, options })
        const move = (from: number, to: number) => {
            if (to < 0 || to >= question.options.length) return
            const next = [...question.options]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            setOptions(next)
        }
        body = (
            <QuestionStep
                number={2}
                title={question.title}
                preview={preview}
                onTitle={(title) => setQuestion({ ...question, title })}
                onBack={onBack}
                footer={
                    preview || question.options.length >= MAX_ROLE_ANSWERS ? null : (
                        <AddItemButton
                            tone="light"
                            label="Add answer"
                            className="mt-4"
                            onClick={() => setOptions(withNewOption(question.options).options)}
                        />
                    )
                }
            >
                {question.options.map((option, index) => (
                    <Answer
                        key={option.id}
                        label={option.label}
                        preview={preview}
                        onChoose={() =>
                            onGo(option.visa ? { kind: 'readiness', visa: option.visa } : { kind: 'unsure' })
                        }
                        onLabel={(label) =>
                            setOptions(question.options.map((o) => (o.id === option.id ? { ...o, label } : o)))
                        }
                        controls={
                            <>
                                <label className="inline-flex items-center gap-1.5 text-[11px] text-ink/55">
                                    Leads to
                                    <select
                                        aria-label={`Where “${option.label || 'this answer'}” leads`}
                                        value={option.visa ?? ''}
                                        onChange={(event) =>
                                            setOptions(
                                                question.options.map((o) =>
                                                    o.id === option.id
                                                        ? { ...o, visa: (event.target.value || null) as VisaId | null }
                                                        : o,
                                                ),
                                            )
                                        }
                                        className={`${selectClass} h-7 px-1.5 text-xs`}
                                    >
                                        {services.map((service) => (
                                            <option key={service.id} value={service.id}>
                                                {service.title}
                                            </option>
                                        ))}
                                        <option value="">“Not sure” page</option>
                                    </select>
                                </label>
                                <ItemControls
                                    tone="light"
                                    index={index}
                                    count={question.options.length}
                                    label={`answer “${option.label || index + 1}”`}
                                    canRemove={question.options.length > 1}
                                    onMove={move}
                                    onRemove={(i) => setOptions(question.options.filter((_, at) => at !== i))}
                                    className="scale-90"
                                />
                            </>
                        }
                    />
                ))}
            </QuestionStep>
        )
    } else if (step.kind === 'readiness') {
        const visa = step.visa
        const question = finder.readiness[visa]
        const setQuestion = (next: typeof question) => set({ readiness: { ...finder.readiness, [visa]: next } })
        body = (
            <QuestionStep
                number={3}
                title={question.title}
                preview={preview}
                onTitle={(title) => setQuestion({ ...question, title })}
                onBack={onBack}
            >
                {question.options.map((option) => (
                    <Answer
                        key={option.id}
                        label={option.label}
                        preview={preview}
                        onChoose={() => onGo({ kind: 'result', visa, readiness: option.id })}
                        onLabel={(label) =>
                            setQuestion({
                                ...question,
                                options: question.options.map((o) => (o.id === option.id ? { ...o, label } : o)),
                            })
                        }
                    />
                ))}
            </QuestionStep>
        )
    } else if (step.kind === 'result') {
        body = (
            <MatchResult
                finder={finder}
                service={services.find((s) => s.id === step.visa)}
                visa={step.visa}
                readiness={step.readiness}
                preview={preview}
                onFinderChange={onFinderChange}
                onShortLabelChange={onShortLabelChange}
                onBack={onBack}
                onStartOver={onStartOver}
            />
        )
    } else {
        body = (
            <UnsureResult
                finder={finder}
                preview={preview}
                onFinderChange={onFinderChange}
                onBack={onBack}
                onStartOver={onStartOver}
            />
        )
    }

    return (
        <section
            aria-label="Visa finder"
            className="mx-auto max-w-6xl rounded-xl border border-royal/10 bg-white/55 px-5 shadow-[0_20px_60px_rgba(22,55,101,0.08)] backdrop-blur-sm @2xl:px-8"
        >
            <div className={isIntro ? 'flex min-h-[260px] flex-col justify-center py-7' : 'py-7 @2xl:py-8'}>
                <header className={isIntro ? undefined : 'mb-6 border-b border-royal/10 pb-5'}>
                    <EditableText
                        readOnly={preview}
                        className="text-xs font-medium uppercase tracking-[0.3em] text-[#9b7512]"
                        editClassName={lightEdit}
                        value={finder.eyebrow}
                        label="Finder eyebrow"
                        placeholder="Eyebrow"
                        invalid={!finder.eyebrow.trim()}
                        onChange={(eyebrow) => set({ eyebrow })}
                    />
                    <EditableText
                        as="h1"
                        readOnly={preview}
                        className="mt-2 font-noto-serif text-3xl leading-tight text-royal @2xl:text-4xl"
                        editClassName={lightEdit}
                        value={finder.heading}
                        label="Finder heading"
                        placeholder="Heading"
                        invalid={!finder.heading.trim()}
                        onChange={(heading) => set({ heading })}
                    />
                </header>
                {body}
            </div>
        </section>
    )
}

function QuestionStep({
    number,
    title,
    preview,
    onTitle,
    onBack,
    footer,
    children,
}: {
    number: number
    title: string
    preview: boolean
    onTitle: (title: string) => void
    onBack: () => void
    footer?: ReactNode
    children: ReactNode
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-royal">
                    Question {number} of {TOTAL_QUESTIONS}
                </p>
                <div className="flex w-28 gap-1.5" aria-hidden>
                    {Array.from({ length: TOTAL_QUESTIONS }, (_, index) => (
                        <span
                            key={index}
                            className={`h-1 flex-1 rounded-full ${index < number ? 'bg-gold-deep' : 'bg-royal/15'}`}
                        />
                    ))}
                </div>
            </div>
            <EditableText
                as="h2"
                readOnly={preview}
                className="mt-5 font-noto-serif text-2xl text-ink @2xl:text-[1.7rem]"
                editClassName={lightEdit}
                value={title}
                label={`Question ${number}`}
                placeholder="Question"
                invalid={!title.trim()}
                onChange={onTitle}
            />
            <ul className="mt-6 grid gap-2.5 @2xl:grid-cols-2">{children}</ul>
            {footer}
            <button type="button" onClick={onBack} className={`${visaQuietLink} mt-6 hover:text-gold-deep`}>
                <ArrowLeft size={16} />
                Back
            </button>
        </div>
    )
}

function Answer({
    label,
    preview,
    onChoose,
    onLabel,
    controls,
}: {
    label: string
    preview: boolean
    onChoose: () => void
    onLabel: (label: string) => void
    controls?: ReactNode
}) {
    const circle = <span aria-hidden className="mt-0.5 flex size-5 shrink-0 rounded-full border border-royal/30" />

    if (preview) {
        return (
            <li>
                <button
                    type="button"
                    onClick={onChoose}
                    className="flex h-full min-h-12 w-full cursor-pointer items-center gap-3 border border-royal/15 bg-white/60 px-4 py-3 text-left text-sm leading-6 text-ink/75 transition-colors hover:border-royal/40"
                >
                    {circle}
                    <span>{label}</span>
                </button>
            </li>
        )
    }

    return (
        <li className="flex h-full flex-col gap-2 border border-royal/15 bg-white/60 px-4 py-3 text-sm leading-6 text-ink/75">
            <div className="flex items-start gap-3">
                {circle}
                <EditableText
                    as="span"
                    className="min-w-0 flex-1"
                    editClassName={lightEdit}
                    value={label}
                    label="Answer"
                    placeholder="Answer text"
                    invalid={!label.trim()}
                    onChange={onLabel}
                />
                <button
                    type="button"
                    onClick={onChoose}
                    title="Follow this answer to its next step"
                    aria-label={`Follow “${label || 'this answer'}”`}
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-royal/20 text-royal/70 transition hover:border-royal hover:bg-royal hover:text-cream"
                >
                    <ArrowRight size={13} />
                </button>
            </div>
            {controls ? <div className="flex flex-wrap items-center justify-between gap-2 pl-8">{controls}</div> : null}
        </li>
    )
}

function ResultNav({ onBack, onStartOver }: { onBack: () => void; onStartOver: () => void }) {
    return (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button type="button" onClick={onBack} className={`${visaQuietLink} hover:text-gold-deep`}>
                <ArrowLeft size={16} />
                Back
            </button>
            <button type="button" onClick={onStartOver} className={`${visaQuietLink} hover:text-gold-deep`}>
                <RotateCcw size={15} />
                Start over
            </button>
        </div>
    )
}

function Disclaimer({
    finder,
    preview,
    onFinderChange,
}: {
    finder: VisaFinder
    preview: boolean
    onFinderChange: (finder: VisaFinder) => void
}) {
    return (
        <div className="mt-8 border-t border-royal/10 pt-5">
            <EditableText
                readOnly={preview}
                multiline
                className="text-xs leading-6 text-ink/50"
                editClassName={lightEdit}
                value={finder.disclaimer}
                label="Finder disclaimer"
                placeholder="Disclaimer shown under every result"
                invalid={!finder.disclaimer.trim()}
                onChange={(disclaimer) => onFinderChange({ ...finder, disclaimer })}
            />
        </div>
    )
}

function MatchResult({
    finder,
    service,
    visa,
    readiness,
    preview,
    onFinderChange,
    onShortLabelChange,
    onBack,
    onStartOver,
}: {
    finder: VisaFinder
    service: FinderServiceView | undefined
    visa: VisaId
    readiness: Readiness
    preview: boolean
    onFinderChange: (finder: VisaFinder) => void
    onShortLabelChange: (visa: VisaId, shortLabel: string) => void
    onBack: () => void
    onStartOver: () => void
}) {
    if (!service) {
        return (
            <UnsureResult
                finder={finder}
                preview={preview}
                onFinderChange={onFinderChange}
                onBack={onBack}
                onStartOver={onStartOver}
            />
        )
    }
    const tourist = visa === 'tourist'
    const notesKey = tourist ? 'touristNotes' : 'notes'
    const note = finder[notesKey][readiness]
    const ready = readiness === 'yes' || readiness === 'arranging'

    return (
        <div className="mx-auto max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-royal">Your AVENture result</p>
            <h2 className="mt-3 font-noto-serif text-2xl text-ink @2xl:text-3xl">Here&rsquo;s Where Your Answers Lead.</h2>
            <p className="mt-4 text-sm leading-7 text-ink/60">
                Based on the answers you provided, the AVENTURES service most closely related to your stated purpose
                is:
            </p>
            <div
                className="mt-5 border-l-2 border-gold-deep bg-royal/[0.04] px-5 py-5"
                title={preview ? undefined : 'The visa name and description are edited on its service page.'}
            >
                <p className="font-noto-serif text-2xl text-royal @2xl:text-[1.7rem]">{service.title}</p>
                <p className="mt-2 text-sm leading-7 text-ink/75">{service.description}</p>
            </div>
            <p className="mt-5 text-sm leading-7 text-ink/60">
                Explore this section to learn more about the visa, its purpose, and the information you should know
                before moving forward.
            </p>
            <div className="mt-4 text-sm leading-7 text-ink/80">
                <span className="font-medium text-royal">Your next step: </span>
                <EditableText
                    as="span"
                    readOnly={preview}
                    className="inline"
                    editClassName={lightEdit}
                    value={note}
                    label="Next step note"
                    placeholder="What to do next"
                    invalid={!note.trim()}
                    onChange={(value) =>
                        onFinderChange({ ...finder, [notesKey]: { ...finder[notesKey], [readiness]: value } })
                    }
                />
                {preview ? null : (
                    <span className="mt-1 block text-[11px] text-ink/45">
                        {tourist
                            ? 'This note is used only for the Tourist Visa.'
                            : 'This note is shared by every visa except the Tourist Visa.'}
                    </span>
                )}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className={visaPrimaryButton}>
                    Explore{' '}
                    <EditableText
                        as="span"
                        readOnly={preview}
                        className="min-w-12"
                        editClassName="bg-white/15"
                        value={service.shortLabel}
                        label={`${service.title} short label`}
                        placeholder="Short label"
                        invalid={!service.shortLabel.trim()}
                        onChange={(value) => onShortLabelChange(visa, value)}
                    />
                    <ArrowRight size={17} />
                </span>
                <span className={visaSecondaryButton}>{ready ? 'Start Visa Assistance' : 'Ask AVENTURES'}</span>
            </div>
            <ResultNav onBack={onBack} onStartOver={onStartOver} />
            <Disclaimer finder={finder} preview={preview} onFinderChange={onFinderChange} />
        </div>
    )
}

function UnsureResult({
    finder,
    preview,
    onFinderChange,
    onBack,
    onStartOver,
}: {
    finder: VisaFinder
    preview: boolean
    onFinderChange: (finder: VisaFinder) => void
    onBack: () => void
    onStartOver: () => void
}) {
    return (
        <div className="mx-auto max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-royal">Not sure or still confused?</p>
                {preview ? null : <FixedBadge title="This message is the same for every “not sure” answer." />}
            </div>
            <h2 className="mt-3 font-noto-serif text-2xl text-ink @2xl:text-3xl">That&rsquo;s completely okay.</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
                Sometimes your situation does not fit neatly into one answer, and you may simply need someone to
                explain your options.
            </p>
            <p className="mt-6 border-l-2 border-gold-deep pl-4 font-noto-serif text-lg italic text-royal">
                &ldquo;When you&rsquo;re unsure about the path, ask before you move forward.&rdquo;
            </p>
            <div className="mt-8">
                <span className={visaPrimaryButton}>
                    Ask AVENTURES
                    <ArrowRight size={17} />
                </span>
            </div>
            <ResultNav onBack={onBack} onStartOver={onStartOver} />
            <Disclaimer finder={finder} preview={preview} onFinderChange={onFinderChange} />
        </div>
    )
}
