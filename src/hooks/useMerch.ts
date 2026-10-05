import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    createMerch,
    createMerchCategory,
    deleteMerch,
    deleteMerchCategory,
    getMerch,
    listMerch,
    listMerchCategories,
    renameMerchCategory,
    reorderMerchCategories,
    updateMerch,
} from '../services/merchService'
import type { MerchCategory, MerchInput, MerchProduct } from '../types/merch'

export const merchKeys = {
    all: ['merch'] as const,
    detail: (slug: string) => ['merch', slug] as const,
    categories: ['merch-categories'] as const,
}

export function useMerchList() {
    return useQuery({ queryKey: merchKeys.all, queryFn: listMerch })
}

export function useMerch(slug: string | undefined) {
    return useQuery({
        queryKey: merchKeys.detail(slug ?? ''),
        queryFn: () => getMerch(slug!),
        enabled: Boolean(slug),
    })
}

function useSyncMerchCache() {
    const queryClient = useQueryClient()
    return (product: MerchProduct, previousSlug?: string) => {
        if (previousSlug && previousSlug !== product.slug) {
            queryClient.removeQueries({ queryKey: merchKeys.detail(previousSlug), exact: true })
        }
        queryClient.setQueryData(merchKeys.detail(product.slug), product)
        void queryClient.invalidateQueries({ queryKey: merchKeys.all, exact: true })
        void queryClient.invalidateQueries({ queryKey: merchKeys.categories })
    }
}

export function useCreateMerch() {
    const sync = useSyncMerchCache()
    return useMutation({
        mutationFn: (input: MerchInput) => createMerch(input),
        onSuccess: (product) => sync(product),
    })
}

export function useUpdateMerch() {
    const sync = useSyncMerchCache()
    return useMutation({
        mutationFn: ({ slug, input }: { slug: string; input: Partial<MerchInput> }) => updateMerch(slug, input),
        onSuccess: (product, { slug }) => sync(product, slug),
    })
}

export function useDeleteMerch() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (slug: string) => deleteMerch(slug),
        onSuccess: (_data, slug) => {
            queryClient.removeQueries({ queryKey: merchKeys.detail(slug), exact: true })
            void queryClient.invalidateQueries({ queryKey: merchKeys.all, exact: true })
            void queryClient.invalidateQueries({ queryKey: merchKeys.categories })
        },
    })
}

export function useMerchCategories() {
    return useQuery({ queryKey: merchKeys.categories, queryFn: listMerchCategories })
}

/** Category changes rename or re-sort product rows, so products are refreshed too. */
function useCategoryMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: merchKeys.categories })
            void queryClient.invalidateQueries({ queryKey: merchKeys.all })
        },
    })
}

export function useCreateMerchCategory() {
    return useCategoryMutation((name: string) => createMerchCategory(name))
}

export function useRenameMerchCategory() {
    return useCategoryMutation(({ id, name }: { id: string; name: string }) => renameMerchCategory(id, name))
}

export function useDeleteMerchCategory() {
    return useCategoryMutation((id: string) => deleteMerchCategory(id))
}

export function useReorderMerchCategories() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (ids: string[]) => reorderMerchCategories(ids),
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: merchKeys.categories })
            const previous = queryClient.getQueryData<MerchCategory[]>(merchKeys.categories)
            if (previous) {
                const byId = new Map(previous.map((category) => [category.id, category]))
                queryClient.setQueryData<MerchCategory[]>(
                    merchKeys.categories,
                    ids.flatMap((id) => byId.get(id) ?? []),
                )
            }
            return { previous }
        },
        onError: (_err, _ids, context) => {
            if (context?.previous) queryClient.setQueryData(merchKeys.categories, context.previous)
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: merchKeys.categories })
            void queryClient.invalidateQueries({ queryKey: merchKeys.all })
        },
    })
}
