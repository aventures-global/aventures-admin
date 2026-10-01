import { CircleHelp, LayoutDashboard, MapPin, Stamp, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import DestinationEditor from '../pages/cms/DestinationEditor'
import Destinations from '../pages/cms/Destinations'
import Faqs from '../pages/cms/Faqs'
import VisaServices from '../pages/cms/VisaServices'

export type NavItem = {
    label: string
    to: string
    icon: LucideIcon
}

export type CmsSubRoute = {
    /** Segment under the item's path, e.g. `new` renders at `/cms/destinations/new`. */
    path: string
    element: ComponentType
}

export type CmsItem = {
    label: string
    /** Segment under `/cms`, e.g. `faqs` renders at `/cms/faqs`. */
    path: string
    icon: LucideIcon
    element: ComponentType
    routes?: CmsSubRoute[]
}

export const CMS_BASE = '/cms'

export const dashboardItem: NavItem = { label: 'Dashboard', to: '/', icon: LayoutDashboard }

export const cmsItems: CmsItem[] = [
    {
        label: 'Destinations',
        path: 'destinations',
        icon: MapPin,
        element: Destinations,
        routes: [
            { path: 'new', element: DestinationEditor },
            { path: ':slug', element: DestinationEditor },
        ],
    },
    { label: 'FAQs', path: 'faqs', icon: CircleHelp, element: Faqs },
    { label: 'Visa Services', path: 'visa-services', icon: Stamp, element: VisaServices },
]

export function cmsPath(item: CmsItem) {
    return `${CMS_BASE}/${item.path}`
}
