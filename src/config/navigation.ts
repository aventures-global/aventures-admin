import {
    Activity,
    Bell,
    Bookmark,
    BookOpen,
    CalendarCheck,
    CalendarDays,
    ChartColumn,
    CircleHelp,
    Contact,
    FileText,
    FolderOpen,
    Handshake,
    Images,
    Inbox,
    Layers,
    LayoutDashboard,
    LayoutTemplate,
    ListChecks,
    ListTodo,
    MapPin,
    MessagesSquare,
    Quote,
    Route,
    Settings,
    ShoppingBag,
    Stamp,
    Store,
    Tag,
    UserCog,
    Users,
    Wallet,
    type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import DestinationEditor from '../pages/cms/DestinationEditor'
import Destinations from '../pages/cms/Destinations'
import Faqs from '../pages/cms/Faqs'
import MerchEditor from '../pages/cms/MerchEditor'
import Partners from '../pages/cms/Partners'
import Shop from '../pages/cms/Shop'
import SitePageEditor from '../pages/cms/SitePageEditor'
import SitePages from '../pages/cms/SitePages'
import Testimonials from '../pages/cms/Testimonials'
import VisaFinderEditor from '../pages/cms/VisaFinderEditor'
import VisaPageEditor from '../pages/cms/VisaPageEditor'
import VisaPages from '../pages/cms/VisaPages'

export type NavItem = {
    label: string
    to: string
    icon: LucideIcon
}

/** `live` pages are built; the rest are roadmap goals. `suggested` pages are not in the proposal. */
export type Wave = 'live' | 'next' | 'later' | 'suggested'

export type SubRoute = {
    /** Segment under the page's path, e.g. `new` renders at `/cms/destinations/new`. */
    path: string
    element: ComponentType
}

export type NavPage = {
    label: string
    /** Segment under the group's base, e.g. `faqs` renders at `/cms/faqs`. */
    path: string
    icon: LucideIcon
    wave: Wave
    summary: string
    goals: string[]
    /** Pages without an element render the shared "not ready yet" placeholder. */
    element?: ComponentType
    routes?: SubRoute[]
}

export type NavGroup = {
    id: string
    label: string
    base: string
    icon: LucideIcon
    pages: NavPage[]
}

export const WAVE_LABELS: Record<Wave, string> = {
    live: 'Available',
    next: 'Next up',
    later: 'Later',
    suggested: 'Suggested',
}

export const WAVE_ORDER: Wave[] = ['live', 'next', 'later', 'suggested']

export const dashboardItem: NavItem = { label: 'Dashboard', to: '/', icon: LayoutDashboard }

export const navGroups: NavGroup[] = [
    {
        id: 'clients',
        label: 'Clients',
        base: '/clients',
        icon: Users,
        pages: [
            {
                label: 'Inquiries',
                path: 'inquiries',
                icon: Inbox,
                wave: 'next',
                summary: 'One inbox for every form on the public site, which today only sends email.',
                goals: [
                    'Store Ask, contact, Start Your AVENture, flights, hotels, and cars submissions',
                    'Filter by form, service, destination, and date',
                    'Turn an inquiry into a customer and lead in one click',
                    'Keep the email notification that staff already receive',
                ],
            },
            {
                label: 'Customers',
                path: 'customers',
                icon: Contact,
                wave: 'next',
                summary: 'The CRM: every lead and customer, with their history in one profile.',
                goals: [
                    'Customer profiles with contact details and travel preferences',
                    'Lead status from New through Contacted, Consultation, Quotation, Follow-up, and Converted or Closed',
                    'Assign leads to staff and keep internal notes',
                    'Inquiry and interaction history',
                    'Search, filter, segment, and export records',
                ],
            },
            {
                label: 'Follow-ups',
                path: 'follow-ups',
                icon: ListTodo,
                wave: 'suggested',
                summary: 'A task list for call-backs and pending replies, so no lead goes quiet.',
                goals: [
                    'Due dates and reminders per lead or customer',
                    'My tasks view for each staff member',
                    'Overdue follow-ups surfaced on the dashboard',
                ],
            },
            {
                label: 'Consultations',
                path: 'consultations',
                icon: MessagesSquare,
                wave: 'next',
                summary: 'A structured record of each consultation and what the customer needs.',
                goals: [
                    'Customer requirements and staff notes',
                    'Consultation status and assigned staff member',
                    'Follow-up tracking and consultation history',
                    'Linked to the customer record in the CRM',
                ],
            },
            {
                label: 'Quotations',
                path: 'quotations',
                icon: FileText,
                wave: 'next',
                summary: 'Build, send, and track customer quotations.',
                goals: [
                    'Customer-specific pricing with selected services and package details',
                    'Optional items the customer can add',
                    'Quotation status and history',
                    'PDF generation and customer access to the quote',
                    'Convert an accepted quote into a booking',
                ],
            },
            {
                label: 'Itineraries',
                path: 'itineraries',
                icon: Route,
                wave: 'suggested',
                summary: 'Day-by-day plans for custom trips, between the quote and the booking.',
                goals: [
                    'Day-by-day activities, stays, and transfers',
                    'Reuse destination content as building blocks',
                    'Share a printable itinerary with the customer',
                ],
            },
            {
                label: 'Bookings',
                path: 'bookings',
                icon: CalendarCheck,
                wave: 'later',
                summary: 'The central booking workflow from confirmation to completion.',
                goals: [
                    'Service and package selection',
                    'Status from Pending through Confirmed, Processing, and Completed or Cancelled',
                    'Scheduling and staff assignment',
                    'Booking history visible to the customer',
                ],
            },
            {
                label: 'Visa applications',
                path: 'visa-applications',
                icon: Stamp,
                wave: 'later',
                summary: 'Track each customer visa application from assessment to decision.',
                goals: [
                    'Application type, applicant details, and assigned staff',
                    'Status from Initial Assessment through Documents, Processing, and Decision',
                    'Required document checklist and application notes',
                    'Timeline history and customer-facing status',
                ],
            },
            {
                label: 'Documents',
                path: 'documents',
                icon: FolderOpen,
                wave: 'next',
                summary: 'Passports, IDs, and supporting files for each customer.',
                goals: [
                    'Customer uploads with categories and document status',
                    'Search and filter across customers',
                    'Staff and admin access controls',
                    'Linked to bookings and visa applications',
                ],
            },
            {
                label: 'Payments',
                path: 'payments',
                icon: Wallet,
                wave: 'later',
                summary: 'Record payments and balances for each booking.',
                goals: [
                    'Amount paid, remaining balance, and payment status',
                    'Transaction history and payment notes',
                    'Basic payment reports',
                    'Tracking only; online payment is a separate integration',
                ],
            },
            {
                label: 'Checklists',
                path: 'checklists',
                icon: ListChecks,
                wave: 'later',
                summary: 'Personalized travel and visa task lists for each customer.',
                goals: [
                    'Staff-managed requirements per booking or visa application',
                    'Completion tracking with status indicators',
                    'Customers tick items off from their account',
                ],
            },
            {
                label: 'Saved plans',
                path: 'plans',
                icon: Bookmark,
                wave: 'later',
                summary: 'AVENture plans customers save and submit for consultation.',
                goals: [
                    'Saved destinations and selected services per plan',
                    'Submitted plans arrive as CRM leads',
                    'Staff can review and comment before the consultation',
                ],
            },
            {
                label: 'Suppliers',
                path: 'suppliers',
                icon: Store,
                wave: 'suggested',
                summary: 'Airlines, hotels, and local partners AVENtures books through.',
                goals: [
                    'Contacts, rates, and notes per supplier',
                    'Link suppliers to bookings and itineraries',
                ],
            },
        ],
    },
    {
        id: 'content',
        label: 'Content',
        base: '/cms',
        icon: Layers,
        pages: [
            {
                label: 'Destinations',
                path: 'destinations',
                icon: MapPin,
                wave: 'live',
                summary: 'Signature journeys on the public Destinations page.',
                goals: [
                    'Search, filter, and sort in card or table view',
                    'Drag cards to set the custom display order',
                    'Create and edit destinations in the live page layout',
                    'Edit cover, highlights, stories, and travel tips',
                ],
                element: Destinations,
                routes: [
                    { path: 'new', element: DestinationEditor },
                    { path: ':slug', element: DestinationEditor },
                ],
            },
            {
                label: 'FAQs',
                path: 'faqs',
                icon: CircleHelp,
                wave: 'live',
                summary: 'Questions on the public FAQ page and beside the homepage contact form.',
                goals: [
                    'Add, edit, search, and delete FAQs',
                    'Create, rename, and reorder categories',
                    'Choose the FAQs shown beside the contact form',
                    'Preview the public FAQ page',
                ],
                element: Faqs,
            },
            {
                label: 'Visa pages',
                path: 'visa-services',
                icon: Stamp,
                wave: 'live',
                summary: 'The public visa service pages and the visa finder.',
                goals: [
                    'Edit each visa service page and its preparation checklist',
                    'Update visa finder questions and outcomes',
                    'Keep internal-only requirements out of public copy',
                ],
                element: VisaPages,
                routes: [
                    { path: 'finder', element: VisaFinderEditor },
                    { path: ':slug', element: VisaPageEditor },
                ],
            },
            {
                label: 'Shop',
                path: 'shop',
                icon: ShoppingBag,
                wave: 'live',
                summary: 'Merchandise already stored in the database and sold on the public shop.',
                goals: [
                    'Add and edit products, prices, sizes, and gallery images',
                    'Mark items in or out of stock',
                ],
                element: Shop,
                routes: [
                    { path: 'new', element: MerchEditor },
                    { path: ':slug', element: MerchEditor },
                ],
            },
            {
                label: 'Testimonials',
                path: 'testimonials',
                icon: Quote,
                wave: 'live',
                summary: 'Customer quotes shown on the homepage and destination pages.',
                goals: ['Add, edit, and reorder testimonials', 'Set the star rating and trip name'],
                element: Testimonials,
            },
            {
                label: 'Partners',
                path: 'partners',
                icon: Handshake,
                wave: 'live',
                summary: 'Partner businesses shown in the Trusted Partners section of the homepage.',
                goals: ['Add and edit partners, with their website and description', 'Upload logos and set their order'],
                element: Partners,
            },
            {
                label: 'Offers',
                path: 'offers',
                icon: Tag,
                wave: 'next',
                summary: 'Homepage offers, which are still written into the code.',
                goals: ['Create, schedule, and retire offers', 'Link an offer to a destination or service'],
            },
            {
                label: 'Stories & journal',
                path: 'stories',
                icon: BookOpen,
                wave: 'later',
                summary: 'Company articles and AVENturer stories submitted by customers.',
                goals: [
                    'Write and publish blog articles',
                    'Review customer stories: draft, approve, reject, publish',
                    'Author profiles and moderation history',
                ],
            },
            {
                label: 'Site pages',
                path: 'site-pages',
                icon: LayoutTemplate,
                wave: 'live',
                summary: 'Homepage, About, Why us, Privacy, and Terms copy.',
                goals: ['Edit page copy without a code change', 'Preview before publishing'],
                element: SitePages,
                routes: [{ path: ':id', element: SitePageEditor }],
            },
        ],
    },
    {
        id: 'insights',
        label: 'Insights',
        base: '/insights',
        icon: ChartColumn,
        pages: [
            {
                label: 'Reports',
                path: 'reports',
                icon: ChartColumn,
                wave: 'later',
                summary: 'Management view of inquiries, leads, bookings, payments, and visas.',
                goals: [
                    'Customer, inquiry, and lead statistics',
                    'Booking reports and sales or payment summaries',
                    'Visa application statistics',
                    'Visual charts and basic exports',
                ],
            },
            {
                label: 'Notifications',
                path: 'notifications',
                icon: Bell,
                wave: 'later',
                summary: 'Customer notices for status changes, bookings, and missing documents.',
                goals: [
                    'System and email notifications',
                    'Status-change, booking, and document-requirement notices',
                    'Communication history per customer',
                ],
            },
            {
                label: 'Calendar',
                path: 'calendar',
                icon: CalendarDays,
                wave: 'suggested',
                summary: 'Consultations, follow-ups, and travel dates in one view.',
                goals: ['Month and week views per staff member', 'Upcoming departures and visa appointments'],
            },
        ],
    },
    {
        id: 'settings',
        label: 'Settings',
        base: '/settings',
        icon: Settings,
        pages: [
            {
                label: 'Staff & access',
                path: 'staff',
                icon: UserCog,
                wave: 'next',
                summary: 'Invite staff and manage customer, staff, and admin roles.',
                goals: [
                    'Invite staff accounts',
                    'Change roles and permissions',
                    'Deactivate accounts that no longer need access',
                ],
            },
            {
                label: 'Site settings',
                path: 'site',
                icon: Settings,
                wave: 'later',
                summary: 'Contact details, address, and social links shown across the site.',
                goals: ['Edit phone, email, and address', 'Update social media links'],
            },
            {
                label: 'Media library',
                path: 'media',
                icon: Images,
                wave: 'suggested',
                summary: 'One place for every image uploaded for destinations and products.',
                goals: ['Browse, search, and reuse uploads', 'Remove unused images'],
            },
            {
                label: 'Activity log',
                path: 'activity',
                icon: Activity,
                wave: 'suggested',
                summary: 'Who changed a quote, a visa status, or a published page, and when.',
                goals: ['Filter by staff member, record, and date'],
            },
        ],
    },
]

export function pagePath(group: NavGroup, page: NavPage) {
    return `${group.base}/${page.path}`
}

export function isReady(page: NavPage) {
    return Boolean(page.element)
}
