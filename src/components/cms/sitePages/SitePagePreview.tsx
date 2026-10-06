import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import MiniMarkdown from '../../../lib/miniMarkdown'
import type { AboutPageContent, HomePageContent, LegalPageContent } from '../../../types/sitePages'

const eyebrowClass = 'text-xs font-semibold uppercase tracking-[0.28em] text-gold-deep'
const proseClass = 'text-base leading-8 text-ink/65'

function PreviewFrame({ children }: { children: ReactNode }) {
    return (
        <div className="luxury-paper overflow-hidden rounded-2xl border border-royal/10 font-poppins text-ink">
            {children}
        </div>
    )
}

export function HomePreview({ content }: { content: HomePageContent }) {
    return (
        <PreviewFrame>
            <div className="bg-[linear-gradient(160deg,#1f3555,#0f1d31)] px-6 py-20 text-center">
                <p className="font-lejour text-4xl text-[#f2d08a] sm:text-6xl">{content.hero.title}</p>
                <p className="mt-3 font-noto-serif text-lg text-[#fffaf0] sm:text-2xl">{content.hero.subtitle}</p>
                <span className="mt-6 inline-block rounded-[3px] border-2 border-[#fffaf0] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-[#fffaf0]">
                    {content.hero.ctaLabel}
                </span>
            </div>
            <div className="bg-white px-6 py-16 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">{content.story.eyebrow}</p>
                <h2 className="mt-4 font-noto-serif text-4xl text-ink">{content.story.title}</h2>
                <div className="mx-auto mt-6 h-px w-16 bg-gold-deep" />
                <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-ink/70">{content.story.body}</p>
                <span className="mt-8 inline-block border-b border-gold-deep pb-1.5 text-sm font-medium uppercase tracking-[0.18em] text-royal">
                    {content.story.linkLabel}
                </span>
            </div>
            <div className="bg-royal px-6 py-20 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">{content.whyUs.eyebrow}</p>
                <h2 className="mt-4 font-noto-serif text-4xl text-cream">{content.whyUs.title}</h2>
                <ul className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-4 gap-y-3 text-base text-cream/85">
                    {content.whyUs.points.map((point, index) => (
                        <li key={index} className="flex items-center gap-3">
                            {index > 0 && <span aria-hidden className="text-gold">◆</span>}
                            {point}
                        </li>
                    ))}
                </ul>
            </div>
        </PreviewFrame>
    )
}

function AboutTab({ label, children }: { label: string; children: ReactNode }) {
    return (
        <section className="border-t border-royal/15 py-12 first:border-t-0">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-royal/50">{label} tab</p>
            {children}
        </section>
    )
}

function Intro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
    return (
        <header>
            <p className={eyebrowClass}>{eyebrow}</p>
            <h2 className="mt-4 font-noto-serif text-3xl leading-tight text-royal sm:text-4xl">{title}</h2>
            {children ? <div className={`mt-5 space-y-5 ${proseClass}`}>{children}</div> : null}
        </header>
    )
}

function TitledGrid({ items }: { items: { title: string; description: string }[] }) {
    return (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
                <article key={index} className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
                    <h3 className="font-noto-serif text-xl text-royal">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/55">{item.description}</p>
                </article>
            ))}
        </div>
    )
}

export function AboutPreview({ content }: { content: AboutPageContent }) {
    const { whyUs, founder, origin, transparency } = content
    return (
        <PreviewFrame>
            <div className="px-6 py-12 sm:px-10">
                <h1 className="font-noto-serif text-4xl text-ink">About AVENTURES</h1>
                <p className={`mt-4 max-w-2xl ${proseClass}`}>{content.intro}</p>

                <AboutTab label="Why Us">
                    <Intro eyebrow={whyUs.eyebrow} title={whyUs.title}>
                        <p>{whyUs.intro}</p>
                    </Intro>
                    <TitledGrid items={whyUs.pillars} />
                    <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                        {whyUs.promise.map((item, index) => (
                            <li key={index} className="flex items-center gap-3 text-sm text-ink/70">
                                <span className="text-gold-deep" aria-hidden>◆</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                    <blockquote className="mt-10 text-center font-noto-serif text-2xl text-royal">“{whyUs.quote}”</blockquote>
                </AboutTab>

                <AboutTab label="Behind the Dream">
                    <Intro eyebrow={founder.eyebrow} title={founder.title}>
                        <MiniMarkdown text={founder.intro} />
                    </Intro>
                    <p className="mt-8 font-noto-serif text-2xl font-semibold text-royal">{founder.name}</p>
                    <p className="text-sm text-ink/55">{founder.role}</p>
                    <p className={`mt-6 ${proseClass}`}>{founder.story}</p>
                    <p className={`mt-4 ${proseClass}`}>{founder.whyItMatters}</p>
                    <blockquote className="mt-10 text-center font-noto-serif text-2xl font-semibold italic text-royal">“{founder.quote}”</blockquote>
                </AboutTab>

                <AboutTab label="Origin">
                    <Intro eyebrow={origin.eyebrow} title={origin.title}>
                        <p>{origin.intro}</p>
                        <p>{origin.story}</p>
                    </Intro>
                    <TitledGrid items={origin.values} />
                    <div className="mt-8 grid overflow-hidden rounded-3xl border border-royal/10 md:grid-cols-2">
                        <div className="bg-royal p-7">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Our mission</p>
                            <p className="mt-4 font-noto-serif text-xl leading-8 text-cream">{origin.mission}</p>
                        </div>
                        <div className="bg-cream p-7">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-royal/60">Our vision</p>
                            <p className="mt-4 font-noto-serif text-xl leading-8 text-royal">{origin.vision}</p>
                        </div>
                    </div>
                </AboutTab>

                <AboutTab label="Trust and Transparency">
                    <Intro eyebrow={transparency.eyebrow} title={transparency.title}>
                        <p>{transparency.intro}</p>
                        <p className="font-serif text-xl text-gold">{transparency.principle}</p>
                    </Intro>
                    <address className="mt-8 space-y-1 text-sm not-italic text-ink/70">
                        <p>{transparency.contact.address}</p>
                        <p>{transparency.contact.email}</p>
                        <p>{transparency.contact.phone}</p>
                    </address>
                    <div className="mt-6 flex flex-wrap gap-2">
                        {transparency.visas.map((visa, index) => (
                            <span key={index} className="rounded-full border border-royal/10 bg-white px-3.5 py-2 text-xs text-ink/65">
                                {visa}
                            </span>
                        ))}
                    </div>
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {transparency.support.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm leading-6 text-ink/65">
                                <Check className="mt-1 shrink-0 text-gold-deep" size={14} aria-hidden />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-6 border-l-2 border-gold-deep/60 pl-5 text-sm leading-7 text-ink/55">{transparency.disclaimer}</p>
                    <p className="mt-8 border-t border-royal/10 pt-6 text-xs leading-6 text-ink/45">{transparency.footnote}</p>
                </AboutTab>
            </div>
        </PreviewFrame>
    )
}

export function LegalPreview({ title, content }: { title: string; content: LegalPageContent }) {
    return (
        <PreviewFrame>
            <div className="px-6 py-14 sm:px-10">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Legal</p>
                <h1 className="mt-4 font-noto-serif text-4xl text-ink">{title}</h1>
                <p className="mt-5 text-xl text-royal">{content.subtitle}</p>
                <div className="mt-3 max-w-3xl space-y-4 text-base leading-8 text-ink/60">
                    <MiniMarkdown text={content.intro} />
                </div>
                <div className="mt-12 max-w-3xl space-y-12">
                    {content.sections.map((section, index) => (
                        <section key={index} className="border-t border-royal/15 pt-8">
                            <p className="text-xs font-medium uppercase tracking-[0.24em] text-royal">{section.label}</p>
                            <h2 className="mt-3 font-noto-serif text-2xl text-ink">{section.title}</h2>
                            <div className="mt-4 space-y-4 text-base leading-8 text-ink/65">
                                <MiniMarkdown text={section.body} />
                            </div>
                        </section>
                    ))}
                </div>
                <p className="mt-12 text-xs text-ink/50">Last updated: {content.lastUpdated}</p>
            </div>
        </PreviewFrame>
    )
}
