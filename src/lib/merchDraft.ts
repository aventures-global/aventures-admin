import type { MerchInput, MerchProduct } from '../types/merch'
import { SLUG_PATTERN } from './tourDraft'

/** Form state: price is typed in dollars and sizes as a comma-separated list. */
export type MerchDraft = {
    slug: string
    name: string
    tagline: string
    description: string
    price: string
    categoryId: string
    coverImage: string
    gallery: string[]
    sizes: string
    inStock: boolean
}

export const EMPTY_MERCH: MerchDraft = {
    slug: '',
    name: '',
    tagline: '',
    description: '',
    price: '',
    categoryId: '',
    coverImage: '',
    gallery: [],
    sizes: '',
    inStock: true,
}

export function toMerchDraft(product: MerchProduct): MerchDraft {
    return {
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        price: (product.priceCents / 100).toFixed(2),
        categoryId: product.categoryId,
        coverImage: product.coverImage,
        gallery: product.gallery,
        sizes: (product.sizes ?? []).join(', '),
        inStock: product.inStock,
    }
}

function parseSizes(value: string): string[] {
    return [...new Set(value.split(',').map((size) => size.trim()).filter(Boolean))]
}

export function toMerchInput(draft: MerchDraft): MerchInput {
    return {
        slug: draft.slug.trim(),
        name: draft.name.trim(),
        tagline: draft.tagline.trim(),
        description: draft.description.trim(),
        priceCents: Math.round(Number(draft.price) * 100),
        currency: 'USD',
        categoryId: draft.categoryId,
        coverImage: draft.coverImage.trim(),
        gallery: draft.gallery,
        sizes: parseSizes(draft.sizes),
        inStock: draft.inStock,
    }
}

export type MerchDraftErrors = {
    fields: Partial<Record<keyof MerchDraft, string>>
    messages: string[]
}

const REQUIRED: { field: keyof MerchDraft; label: string }[] = [
    { field: 'name', label: 'Name' },
    { field: 'tagline', label: 'Tagline' },
    { field: 'description', label: 'Description' },
    { field: 'categoryId', label: 'Category' },
    { field: 'coverImage', label: 'Cover image' },
]

export function validateMerchDraft(draft: MerchDraft): MerchDraftErrors {
    const fields: MerchDraftErrors['fields'] = {}

    for (const { field, label } of REQUIRED) {
        if (!String(draft[field]).trim()) fields[field] = `${label} is required`
    }

    const slug = draft.slug.trim()
    if (!slug) fields.slug = 'URL slug is required'
    else if (!SLUG_PATTERN.test(slug)) {
        fields.slug = 'URL slug can only use lowercase letters, numbers, and single hyphens'
    } else if (slug === 'categories') {
        fields.slug = 'This URL slug is reserved'
    }

    const price = draft.price.trim()
    if (!price) fields.price = 'Price is required'
    else if (!/^\d+(\.\d{1,2})?$/.test(price)) fields.price = 'Price must be a dollar amount like 32 or 32.50'

    return { fields, messages: Object.values(fields) }
}
