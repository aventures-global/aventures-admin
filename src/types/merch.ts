export type MerchProduct = {
    id: string
    slug: string
    name: string
    tagline: string
    description: string
    price: string
    priceCents: number
    currency: string
    categoryId: string
    category: string
    coverImage: string
    gallery: string[]
    sizes?: string[]
    inStock: boolean
}

export type MerchCategory = {
    id: string
    name: string
    sortOrder: number
    productCount: number
}

export type MerchInput = {
    slug: string
    name: string
    tagline: string
    description: string
    priceCents: number
    currency: string
    categoryId: string
    coverImage: string
    gallery: string[]
    sizes: string[]
    inStock: boolean
}
