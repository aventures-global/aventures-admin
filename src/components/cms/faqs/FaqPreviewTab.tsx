import { ArrowRight, Monitor, RefreshCw, Smartphone } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { usePublicFaqs } from '../../../hooks/useFaqs'
import ContactFaqs from './preview/ContactFaqs'
import FaqBrowser from './preview/FaqBrowser'

type Device = 'desktop' | 'mobile'

export default function FaqPreviewTab() {
    const [device, setDevice] = useState<Device>('desktop')
    const { data, isPending, isError, error, refetch, isFetching } = usePublicFaqs()

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-xs leading-relaxed text-ink/60">
                    What visitors see right now, using saved changes. Links are disabled here.
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-royal/25 px-3 text-sm text-ink/75 transition hover:border-royal hover:text-royal disabled:opacity-60"
                    >
                        <RefreshCw size={14} strokeWidth={1.75} className={isFetching ? 'animate-spin' : ''} aria-hidden />
                        Refresh
                    </button>
                    <div
                        role="group"
                        aria-label="Preview width"
                        className="inline-flex h-9 items-center rounded-[3px] border border-royal/25 bg-white/60 p-0.5"
                    >
                        <DeviceButton label="Desktop" active={device === 'desktop'} onClick={() => setDevice('desktop')}>
                            <Monitor size={15} strokeWidth={1.6} />
                        </DeviceButton>
                        <DeviceButton label="Mobile" active={device === 'mobile'} onClick={() => setDevice('mobile')}>
                            <Smartphone size={15} strokeWidth={1.6} />
                        </DeviceButton>
                    </div>
                </div>
            </div>

            {isPending ? (
                <div className="h-96 skeleton-paper rounded-[3px]" />
            ) : isError ? (
                <div className="rounded-[3px] border border-red-700/20 bg-red-50/60 px-6 py-12 text-center">
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
                <>
                    <PreviewFrame label="Homepage — beside the contact form" device={device}>
                        <div className="max-w-md py-10">
                            <ContactFaqs
                                faqs={data.top}
                                allLink={
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-royal">
                                        See all FAQs
                                        <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
                                    </span>
                                }
                            />
                            {data.top.length === 0 ? (
                                <p className="mt-4 text-xs text-ink/45">
                                    No FAQs are queued, so only the link shows.
                                </p>
                            ) : null}
                        </div>
                    </PreviewFrame>

                    <PreviewFrame label="FAQ page" device={device}>
                        <div className="py-12">
                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">Support</p>
                            <h1 className="mt-4 font-noto-serif text-4xl text-ink sm:text-5xl">
                                Frequently Asked Questions
                            </h1>
                            <p className="mt-5 font-noto-serif text-xl text-royal sm:text-2xl">
                                Have a question about your AVENture?
                            </p>
                            <p className="mt-3 max-w-2xl text-base leading-8 text-ink/60">
                                We&rsquo;ve gathered some of the questions applicants and travelers commonly ask about
                                U.S. visa applications, documents, fees, interviews, processing, and travel planning.
                                Choose a category below to find the information you&rsquo;re looking for.
                            </p>
                            <div className="mt-10">
                                <FaqBrowser
                                    categories={data.categories}
                                    idPrefix="preview-faq"
                                    outlineTopClass="top-6"
                                    chipsTopClass="top-[3.25rem] lg:top-0"
                                    activeOffset={120}
                                />
                            </div>
                        </div>
                    </PreviewFrame>
                </>
            )}
        </div>
    )
}

function PreviewFrame({ label, device, children }: { label: string; device: Device; children: ReactNode }) {
    return (
        <section aria-label={`${label} preview`}>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-royal">{label}</p>
            <div
                className={`rounded-[3px] border border-royal/20 bg-oat font-poppins text-ink shadow-[0_10px_30px_rgba(22,55,101,0.06)] ${
                    device === 'mobile' ? 'mx-auto max-w-[390px]' : ''
                }`}
            >
                <div className="px-6 sm:px-8">{children}</div>
            </div>
        </section>
    )
}

function DeviceButton({
    label,
    active,
    onClick,
    children,
}: {
    label: string
    active: boolean
    onClick: () => void
    children: ReactNode
}) {
    return (
        <button
            type="button"
            aria-label={`${label} width`}
            title={label}
            aria-pressed={active}
            onClick={onClick}
            className={`flex h-full w-8 items-center justify-center rounded-[2px] transition ${
                active ? 'bg-royal text-cream' : 'text-ink/55 hover:text-royal'
            }`}
        >
            {children}
        </button>
    )
}
