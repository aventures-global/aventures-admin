import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { REGION_OPTIONS, type TourSearchParams, type TourSort } from '../types/tour'

export type DestinationView = 'cards' | 'table'

const SORTS: TourSort[] = ['custom', 'name', 'location', 'region', 'featured', 'updated']

export function defaultDir(sort: TourSort): 'asc' | 'desc' {
    return sort === 'updated' ? 'desc' : 'asc'
}

export function useDestinationFilters() {
    const [searchParams, setSearchParams] = useSearchParams()

    const filters = useMemo<TourSearchParams>(() => {
        const regionRaw = searchParams.get('region')
        const sortRaw = searchParams.get('sort') as TourSort | null
        const sort = sortRaw && SORTS.includes(sortRaw) ? sortRaw : 'custom'
        const dirRaw = searchParams.get('dir')
        return {
            q: searchParams.get('q') ?? '',
            region: REGION_OPTIONS.some((option) => option.id === regionRaw)
                ? (regionRaw as TourSearchParams['region'])
                : 'all',
            featured: searchParams.get('featured') === 'true',
            sort,
            dir: dirRaw === 'asc' || dirRaw === 'desc' ? dirRaw : defaultDir(sort),
        }
    }, [searchParams])

    const view: DestinationView = searchParams.get('view') === 'table' ? 'table' : 'cards'

    const update = (patch: Partial<TourSearchParams> & { view?: DestinationView }) => {
        const next = { ...filters, view, ...patch }
        const params = new URLSearchParams()
        if (next.q.trim()) params.set('q', next.q.trim())
        if (next.region !== 'all') params.set('region', next.region)
        if (next.featured) params.set('featured', 'true')
        if (next.sort !== 'custom') params.set('sort', next.sort)
        if (next.dir !== defaultDir(next.sort)) params.set('dir', next.dir)
        if (next.view === 'table') params.set('view', 'table')
        setSearchParams(params, { replace: true })
    }

    const hasFilters = filters.q.trim() !== '' || filters.region !== 'all' || filters.featured

    const clearFilters = () => update({ q: '', region: 'all', featured: false })

    return { filters, view, update, hasFilters, clearFilters }
}
