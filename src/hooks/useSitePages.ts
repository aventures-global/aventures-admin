import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { SITE_PAGES } from '../lib/sitePages'
import { getSitePage, saveSitePage } from '../services/sitePageService'
import type { SitePageContentMap, SitePageId } from '../types/sitePages'

export const sitePageKeys = {
    page: (id: SitePageId) => ['sitePages', id] as const,
}

export function useSitePage<Id extends SitePageId>(id: Id) {
    return useQuery({ queryKey: sitePageKeys.page(id), queryFn: () => getSitePage(id) })
}

export function useSitePageList() {
    return useQueries({
        queries: SITE_PAGES.map((page) => ({
            queryKey: sitePageKeys.page(page.id),
            queryFn: () => getSitePage(page.id),
        })),
    })
}

export function useSaveSitePage<Id extends SitePageId>(id: Id) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (content: SitePageContentMap[Id]) => saveSitePage(id, content),
        onSuccess: (page) => queryClient.setQueryData(sitePageKeys.page(id), page),
    })
}
