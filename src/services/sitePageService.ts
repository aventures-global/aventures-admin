import type { SitePage, SitePageContentMap, SitePageId } from '../types/sitePages'
import { api } from './api'

export async function getSitePage<Id extends SitePageId>(id: Id): Promise<SitePage<Id>> {
    const { data } = await api.get<SitePage<Id>>(`/api/pages/${id}`)
    return data
}

export async function saveSitePage<Id extends SitePageId>(
    id: Id,
    content: SitePageContentMap[Id],
): Promise<SitePage<Id>> {
    const { data } = await api.put<SitePage<Id>>(`/api/pages/${id}`, content)
    return data
}
