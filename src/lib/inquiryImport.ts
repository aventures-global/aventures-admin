/** Matches the attachment produced by the server inquiry email sender. */
export const INQUIRY_ATTACHMENT_FORMAT = 'aventure-inquiry'
export const INQUIRY_ATTACHMENT_VERSION = 1

export type ImportedInquiryDraft = {
    customerName: string
    customerEmail: string
    title: string
    notes: string
}

type InquiryRecord = Record<string, unknown>

function asTrimmedString(value: unknown): string {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value).trim()
    if (typeof value !== 'string') return ''
    return value.trim()
}

function field(label: string, value: unknown): string | null {
    const text = asTrimmedString(value)
    return text ? `${label}: ${text}` : null
}

function section(title: string, lines: Array<string | null>): string[] {
    const present = lines.filter((line): line is string => Boolean(line))
    if (!present.length) return []
    return [`${title}`, ...present.map((line) => `  ${line}`), '']
}

function fullName(inquiry: InquiryRecord) {
    return [asTrimmedString(inquiry.firstName), asTrimmedString(inquiry.lastName)].filter(Boolean).join(' ')
}

function looksLikeEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function titleFromInquiry(inquiry: InquiryRecord): string {
    const kind = asTrimmedString(inquiry.kind)
    switch (kind) {
        case 'onboarding': {
            const destination = asTrimmedString(inquiry.destination)
            const service = asTrimmedString(inquiry.service)
            return [destination, service].filter(Boolean).join(' · ') || 'Start Your AVENture inquiry'
        }
        case 'flights': {
            const origin = asTrimmedString(inquiry.origin)
            const destination = asTrimmedString(inquiry.destination)
            const route = origin && destination ? `${origin} → ${destination}` : origin || destination
            return route ? `Flights · ${route}` : 'Flight request'
        }
        case 'hotels': {
            const destination = asTrimmedString(inquiry.destination)
            return destination ? `Hotels · ${destination}` : 'Hotel request'
        }
        case 'cars': {
            const pickup = asTrimmedString(inquiry.pickup)
            return pickup ? `Transfer · ${pickup}` : 'Transfer request'
        }
        case 'consultation': {
            const service = asTrimmedString(inquiry.service)
            return service ? `Consultation · ${service}` : 'Consultation request'
        }
        case 'contact': {
            const interest = asTrimmedString(inquiry.interest)
            return interest ? `Travel inquiry · ${interest}` : 'Travel inquiry'
        }
        case 'question': {
            const visaType = asTrimmedString(inquiry.visaType)
            return visaType ? `Ask · ${visaType}` : 'Ask AVENtures question'
        }
        default:
            return 'Inquiry'
    }
}

function notesFromInquiry(inquiry: InquiryRecord): string {
    const kind = asTrimmedString(inquiry.kind)
    const blocks: string[] = [
        ...section('Guest', [
            field('Name', fullName(inquiry)),
            field('Email', inquiry.email),
            field('Phone', inquiry.phone),
            kind === 'onboarding' ? field('Preferred contact', inquiry.contactMethod) : null,
        ]),
    ]

    if (kind === 'onboarding') {
        blocks.push(
            ...section('The trip', [
                field('Service', inquiry.service),
                field('Destination', inquiry.destination),
                field('Departure', inquiry.departure),
                field('Return', inquiry.returnDate),
                field('Trip length', inquiry.duration),
                field('Flexible dates', inquiry.flexibleDates),
            ]),
            ...section('Travelers', [
                field('Traveling as', inquiry.group),
                field('Adults', inquiry.adults),
                field('Children', inquiry.children),
                field('Group size', inquiry.groupSize),
            ]),
            ...section('Budget', [field('Range', inquiry.budget), field('Basis', inquiry.budgetType)]),
            ...section('Accommodation', [
                field('Stay style', inquiry.accommodation),
                field('Priorities', inquiry.accommodationNeeds),
            ]),
            ...section('Itinerary', [
                field('Interests', inquiry.interests),
                field('Places in mind', inquiry.hasPlans),
                field('Places to visit', inquiry.plannedPlaces),
            ]),
            ...section('Flights', [
                field('Priority', inquiry.flightPriority),
                field('Cabin', inquiry.cabin),
                field('Baggage', inquiry.baggage),
            ]),
            ...section('Transportation', [field('Needs', inquiry.transportation)]),
            ...section('Visa assistance', [
                field('Visa service', inquiry.visaType),
                field('Travel purpose', inquiry.visaPurpose),
                field('Current stage', inquiry.visaStatus),
                field('Passport status', inquiry.passportStatus),
                field('Passport expiry', inquiry.passportExpiry),
                field('Previous application', inquiry.previousVisa),
                field('Existing appointment', inquiry.appointment),
                field('Help needed', inquiry.visaHelp),
            ]),
        )
    } else if (kind === 'flights') {
        blocks.push(
            ...section('Trip details', [
                field('Origin', inquiry.origin),
                field('Destination', inquiry.destination),
                field('Depart', inquiry.departDate),
                field('Return', inquiry.returnDate),
                field('Passengers', inquiry.passengers),
                field('Cabin', inquiry.cabin),
            ]),
        )
    } else if (kind === 'hotels') {
        blocks.push(
            ...section('Trip details', [
                field('Destination', inquiry.destination),
                field('Check-in', inquiry.checkIn),
                field('Check-out', inquiry.checkOut),
                field('Rooms', inquiry.rooms),
                field('Guests', inquiry.guests),
            ]),
        )
    } else if (kind === 'cars') {
        blocks.push(
            ...section('Trip details', [
                field('Pickup', inquiry.pickup),
                field('Drop-off', inquiry.dropoff),
                field('Pickup date', inquiry.pickupDate),
                field('Passengers', inquiry.passengers),
            ]),
        )
    } else if (kind === 'consultation') {
        blocks.push(...section('Trip details', [field('Service', inquiry.service)]))
    } else if (kind === 'contact') {
        blocks.push(...section('Trip details', [field('Looking for', inquiry.interest)]))
    } else if (kind === 'question') {
        blocks.push(...section('Question details', [field('Visa type', inquiry.visaType)]))
    }

    const message =
        asTrimmedString(inquiry.message) ||
        asTrimmedString(inquiry.question) ||
        asTrimmedString(inquiry.notes)
    if (message) {
        blocks.push(...section(kind === 'question' ? 'Their question' : 'Their message', [message]))
    }

    return blocks.join('\n').trim()
}

export function parseInquiryAttachment(raw: unknown): ImportedInquiryDraft {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('This file is not a valid AVENtures inquiry attachment')
    }

    const root = raw as Record<string, unknown>
    if (root.format !== INQUIRY_ATTACHMENT_FORMAT) {
        throw new Error('This file is not an AVENtures inquiry attachment')
    }
    if (root.version !== INQUIRY_ATTACHMENT_VERSION) {
        throw new Error(`Unsupported inquiry attachment version (${String(root.version)})`)
    }
    if (!root.inquiry || typeof root.inquiry !== 'object' || Array.isArray(root.inquiry)) {
        throw new Error('Inquiry attachment is missing guest details')
    }

    const inquiry = root.inquiry as InquiryRecord
    const customerEmail = asTrimmedString(inquiry.email).toLowerCase()
    if (!customerEmail || !looksLikeEmail(customerEmail)) {
        throw new Error('Inquiry attachment is missing a valid guest email')
    }

    const customerName = fullName(inquiry) || customerEmail
    const title = titleFromInquiry(inquiry)
    const notes = notesFromInquiry(inquiry)

    return { customerName, customerEmail, title, notes }
}

export async function readInquiryAttachmentFile(file: File): Promise<ImportedInquiryDraft> {
    const text = await file.text()
    let parsed: unknown
    try {
        parsed = JSON.parse(text) as unknown
    } catch {
        throw new Error('Could not read this file as JSON')
    }
    return parseInquiryAttachment(parsed)
}
