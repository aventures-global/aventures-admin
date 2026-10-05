import { ExternalLink, Plus } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import SectionTabs from '../../components/cms/SectionTabs'
import ShopCategoriesTab from '../../components/cms/shop/ShopCategoriesTab'
import SafeImage from '../../components/ui/SafeImage'
import { useMerchCategories, useMerchList } from '../../hooks/useMerch'
import { primaryActionClass } from '../../lib/formStyles'
import { publicSiteUrl } from '../../lib/publicSite'

const TABS = [
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
] as const

type TabId = (typeof TABS)[number]['id']

function isTab(value: string | null): value is TabId {
    return TABS.some((tab) => tab.id === value)
}

export default function Shop() {
    const [searchParams, setSearchParams] = useSearchParams()
    const param = searchParams.get('tab')
    const tab: TabId = isTab(param) ? param : 'products'

    const changeTab = (id: TabId) => {
        setSearchParams(id === 'products' ? {} : { tab: id }, { replace: true })
    }

    return (
        <div>
            <PageHeader
                eyebrow="CMS"
                title="Shop"
                description="Merchandise sold on the public shop. Open a product to edit its details, price, sizes, and images, or manage the categories shoppers filter by."
                actions={
                    <Link to="new" className={primaryActionClass}>
                        <Plus size={15} strokeWidth={1.75} aria-hidden />
                        New product
                    </Link>
                }
            />

            <div className="mt-6">
                <SectionTabs tabs={TABS} value={tab} onChange={changeTab} label="Shop sections" />
            </div>

            <div className="mt-6">{tab === 'categories' ? <CategoriesPanel /> : <ProductsPanel />}</div>
        </div>
    )
}

function CategoriesPanel() {
    const { data, isPending, isError, error, refetch } = useMerchCategories()

    if (isPending) {
        return (
            <div className="max-w-3xl space-y-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 skeleton-paper rounded-[3px]" />
                ))}
            </div>
        )
    }
    if (isError) {
        return (
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
        )
    }
    return <ShopCategoriesTab categories={data} />
}

function ProductsPanel() {
    const navigate = useNavigate()
    const { data: products = [], isPending, isError, error, refetch } = useMerchList()

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <p className="text-ink/60" aria-live="polite">
                    {isPending ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
                </p>
                <a
                    href={publicSiteUrl('/shop')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-royal transition hover:text-gold-deep"
                >
                    View public shop
                    <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
                </a>
            </div>

            <div className="mt-4">
                {isPending ? (
                    <div className="space-y-2">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-14 skeleton-shimmer rounded-[3px]" />
                        ))}
                    </div>
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
                ) : products.length === 0 ? (
                    <div className="rounded-[3px] border border-royal/15 px-6 py-16 text-center">
                        <p className="font-noto-serif text-2xl text-ink">No products yet</p>
                        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
                            Add the first product to publish it on the shop.
                        </p>
                        <Link
                            to="new"
                            className="mt-6 inline-block text-sm font-medium text-royal transition hover:text-gold-deep"
                        >
                            New product
                        </Link>
                    </div>
                ) : (
                    <div className="paper-card overflow-x-auto rounded-[3px]">
                        <table className="w-full min-w-[44rem] text-left text-sm">
                            <thead className="border-b border-royal/15 bg-cream text-[11px] uppercase tracking-[0.14em] text-ink/55">
                                <tr>
                                    <th scope="col" className="w-20 px-3 py-2.5 font-normal" />
                                    <th scope="col" className="px-3 py-2.5 font-normal">Product</th>
                                    <th scope="col" className="px-3 py-2.5 font-normal">Category</th>
                                    <th scope="col" className="px-3 py-2.5 font-normal">Sizes</th>
                                    <th scope="col" className="px-3 py-2.5 text-right font-normal">Price</th>
                                    <th scope="col" className="px-3 py-2.5 text-center font-normal">Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-royal/10">
                                {products.map((product) => (
                                    <tr
                                        key={product.id}
                                        tabIndex={0}
                                        onClick={() => navigate(product.slug)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') navigate(product.slug)
                                        }}
                                        className="cursor-pointer transition-colors hover:bg-royal/[0.03] focus-visible:bg-royal/[0.05] focus-visible:outline-none"
                                    >
                                        <td className="px-3 py-2">
                                            <SafeImage
                                                src={product.coverImage}
                                                alt=""
                                                className="h-12 w-12 rounded-[3px]"
                                                imgClassName="object-cover"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="font-noto-serif text-base text-ink">{product.name}</p>
                                            <p className="text-xs text-ink/45">/shop/{product.slug}</p>
                                        </td>
                                        <td className="px-3 py-2 text-ink/80">{product.category}</td>
                                        <td className="px-3 py-2 text-ink/60">
                                            {product.sizes?.length ? product.sizes.join(', ') : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right font-noto-serif text-base text-royal">
                                            {product.price}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span
                                                className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${
                                                    product.inStock
                                                        ? 'bg-emerald-50 text-emerald-800'
                                                        : 'bg-red-50 text-red-800'
                                                }`}
                                            >
                                                {product.inStock ? 'In stock' : 'Sold out'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
