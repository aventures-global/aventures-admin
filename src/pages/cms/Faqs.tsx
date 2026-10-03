import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import SectionTabs from '../../components/cms/SectionTabs'
import FaqCatalogTab from '../../components/cms/faqs/FaqCatalogTab'
import FaqCategoriesTab from '../../components/cms/faqs/FaqCategoriesTab'
import FaqPreviewTab from '../../components/cms/faqs/FaqPreviewTab'
import { useFaqAdminData } from '../../hooks/useFaqs'

const TABS = [
    { id: 'faqs', label: 'FAQs' },
    { id: 'categories', label: 'Categories' },
    { id: 'preview', label: 'Preview' },
] as const

type TabId = (typeof TABS)[number]['id']

function isTab(value: string | null): value is TabId {
    return TABS.some((tab) => tab.id === value)
}

export default function Faqs() {
    const [searchParams, setSearchParams] = useSearchParams()
    const param = searchParams.get('tab')
    const tab: TabId = isTab(param) ? param : 'faqs'
    const { data, isPending, isError, error, refetch } = useFaqAdminData()

    const changeTab = (id: TabId) => {
        setSearchParams(id === 'faqs' ? {} : { tab: id }, { replace: true })
    }

    return (
        <div>
            <PageHeader
                eyebrow="CMS"
                title="FAQs"
                description="Questions shown on the public FAQ page, grouped by category, plus the short list shown beside the contact form on the homepage."
            />

            <div className="mt-6">
                <SectionTabs tabs={TABS} value={tab} onChange={changeTab} label="FAQ sections" />
            </div>

            <div className="mt-6">
                {tab === 'preview' ? (
                    <FaqPreviewTab />
                ) : isPending ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-16 skeleton-paper rounded-[3px]" />
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
                ) : tab === 'categories' ? (
                    <FaqCategoriesTab categories={data.categories} />
                ) : (
                    <FaqCatalogTab data={data} />
                )}
            </div>
        </div>
    )
}
