export type FaqCategory = {
    id: string
    name: string
    faqCount: number
}

export type Faq = {
    id: string
    question: string
    answer: string
    categoryIds: string[]
    updatedAt: string
}

export type FaqInput = {
    question: string
    answer: string
    categoryIds: string[]
}

export type FaqAdminData = {
    categories: FaqCategory[]
    faqs: Faq[]
    topIds: string[]
    topLimit: number
}

export type PublicFaq = { id: string; question: string; answer: string }

export type PublicFaqData = {
    categories: { id: string; name: string; faqs: PublicFaq[] }[]
    top: PublicFaq[]
}
