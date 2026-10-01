import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
    type InfiniteData,
    type QueryClient,
} from '@tanstack/react-query'

import { moveItem } from '../lib/listOps'
import {
    createTour,
    deleteTour,
    getTour,
    listTours,
    moveTour,
    searchTours,
    updateTour,
    type TourMove,
} from '../services/tourService'
import type { Tour, TourInput, TourSearchPage, TourSearchParams } from '../types/tour'

export const tourKeys = {
    all: ['tours'] as const,
    detail: (slug: string) => ['tours', slug] as const,
    searchAll: ['tour-search'] as const,
    search: (params: TourSearchParams) => ['tour-search', params] as const,
}

function invalidateLists(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: tourKeys.all, exact: true })
    void queryClient.invalidateQueries({ queryKey: tourKeys.searchAll })
}

export function useTours() {
    return useQuery({ queryKey: tourKeys.all, queryFn: listTours })
}

export function useTourSearch(params: TourSearchParams) {
    return useInfiniteQuery({
        queryKey: tourKeys.search(params),
        queryFn: ({ pageParam }) => searchTours(params, pageParam),
        initialPageParam: 0,
        getNextPageParam: (last) => last.nextCursor,
        placeholderData: keepPreviousData,
    })
}

export function useTour(slug: string | undefined) {
    return useQuery({
        queryKey: tourKeys.detail(slug ?? ''),
        queryFn: () => getTour(slug!),
        enabled: Boolean(slug),
    })
}

function useSyncTourCache() {
    const queryClient = useQueryClient()
    return (tour: Tour, previousSlug?: string) => {
        if (previousSlug && previousSlug !== tour.slug) {
            queryClient.removeQueries({ queryKey: tourKeys.detail(previousSlug), exact: true })
        }
        queryClient.setQueryData(tourKeys.detail(tour.slug), tour)
        invalidateLists(queryClient)
    }
}

export function useCreateTour() {
    const sync = useSyncTourCache()
    return useMutation({
        mutationFn: (input: TourInput) => createTour(input),
        onSuccess: (tour) => sync(tour),
    })
}

export function useUpdateTour() {
    const sync = useSyncTourCache()
    return useMutation({
        mutationFn: ({ slug, input }: { slug: string; input: Partial<TourInput> }) =>
            updateTour(slug, input),
        onSuccess: (tour, { slug }) => sync(tour, slug),
    })
}

export function useDeleteTour() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (slug: string) => deleteTour(slug),
        onSuccess: (_data, slug) => {
            queryClient.removeQueries({ queryKey: tourKeys.detail(slug), exact: true })
            invalidateLists(queryClient)
        },
    })
}

type MoveVariables = {
    params: TourSearchParams
    slug: string
    from: number
    to: number
    move: TourMove
}

function reorderPages(
    data: InfiniteData<TourSearchPage, number>,
    from: number,
    to: number,
): InfiniteData<TourSearchPage, number> {
    const items = moveItem(
        data.pages.flatMap((page) => page.items),
        from,
        to,
    )
    let offset = 0
    return {
        ...data,
        pages: data.pages.map((page) => {
            const slice = items.slice(offset, offset + page.items.length)
            offset += page.items.length
            return { ...page, items: slice }
        }),
    }
}

export function useMoveTour() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ slug, move }: MoveVariables) => moveTour(slug, move),
        onMutate: async ({ params, from, to }) => {
            const key = tourKeys.search(params)
            await queryClient.cancelQueries({ queryKey: key })
            const previous = queryClient.getQueryData<InfiniteData<TourSearchPage, number>>(key)
            if (previous) queryClient.setQueryData(key, reorderPages(previous, from, to))
            return { key, previous }
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(context.key, context.previous)
        },
        onSettled: () => invalidateLists(queryClient),
    })
}
