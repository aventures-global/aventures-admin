import type { PublicFaq, PublicFaqData } from '../types/faq'
import type { VisaServiceInput } from '../types/visa'

export type FaqCategoryOption = PublicFaqData['categories'][number]

export type ResolvedVisaFaqs = {
    category: FaqCategoryOption | undefined
    intro: PublicFaq | undefined
    qualify: PublicFaq | undefined
    more: PublicFaq[]
}

/** The FAQs a visa section shows, matching how the public page resolves them. */
export function resolveVisaFaqs(
    categories: FaqCategoryOption[],
    service: Pick<VisaServiceInput, 'faqCategoryId' | 'introFaqId' | 'qualifyFaqId'>,
): ResolvedVisaFaqs {
    const category = service.faqCategoryId ? categories.find((c) => c.id === service.faqCategoryId) : undefined
    const faqs = category?.faqs ?? []
    const intro = service.introFaqId ? faqs.find((faq) => faq.id === service.introFaqId) : undefined
    const qualify = service.qualifyFaqId ? faqs.find((faq) => faq.id === service.qualifyFaqId) : undefined
    return { category, intro, qualify, more: faqs.filter((faq) => faq !== intro && faq !== qualify) }
}
