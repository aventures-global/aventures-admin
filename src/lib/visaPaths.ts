import type { VisaPage, VisaService } from '../types/visa'

export const VISA_FINDER_PATH = '/visa-assistance'

export function visaPagePath(slug: string) {
    return `/services/visa/${slug}`
}

export function visaServicePath(page: VisaPage, service: VisaService) {
    const path = visaPagePath(page.slug)
    return page.visas.length > 1 ? `${path}#${service.anchor}` : path
}
