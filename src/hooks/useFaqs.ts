import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    addTopFaq,
    createFaq,
    createFaqCategory,
    deleteFaq,
    deleteFaqCategory,
    getFaqAdminData,
    getPublicFaqs,
    removeTopFaq,
    renameFaqCategory,
    reorderFaqCategories,
    updateFaq,
} from '../services/faqService'
import type { FaqAdminData, FaqInput } from '../types/faq'

export const faqKeys = {
    all: ['faqs'] as const,
    admin: ['faqs', 'admin'] as const,
    public: ['faqs', 'public'] as const,
}

export function useFaqAdminData() {
    return useQuery({ queryKey: faqKeys.admin, queryFn: getFaqAdminData })
}

export function usePublicFaqs() {
    return useQuery({ queryKey: faqKeys.public, queryFn: getPublicFaqs })
}

function useFaqMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSettled: () => queryClient.invalidateQueries({ queryKey: faqKeys.all }),
    })
}

export function useCreateFaqCategory() {
    return useFaqMutation((name: string) => createFaqCategory(name))
}

export function useRenameFaqCategory() {
    return useFaqMutation(({ id, name }: { id: string; name: string }) => renameFaqCategory(id, name))
}

export function useDeleteFaqCategory() {
    return useFaqMutation((id: string) => deleteFaqCategory(id))
}

export function useReorderFaqCategories() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (ids: string[]) => reorderFaqCategories(ids),
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: faqKeys.admin })
            const previous = queryClient.getQueryData<FaqAdminData>(faqKeys.admin)
            if (previous) {
                const byId = new Map(previous.categories.map((category) => [category.id, category]))
                queryClient.setQueryData<FaqAdminData>(faqKeys.admin, {
                    ...previous,
                    categories: ids.flatMap((id) => byId.get(id) ?? []),
                })
            }
            return { previous }
        },
        onError: (_err, _ids, context) => {
            if (context?.previous) queryClient.setQueryData(faqKeys.admin, context.previous)
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: faqKeys.all }),
    })
}

export function useCreateFaq() {
    return useFaqMutation((input: FaqInput) => createFaq(input))
}

export function useUpdateFaq() {
    return useFaqMutation(({ id, input }: { id: string; input: Partial<FaqInput> }) => updateFaq(id, input))
}

export function useDeleteFaq() {
    return useFaqMutation((id: string) => deleteFaq(id))
}

export function useAddTopFaq() {
    return useFaqMutation((faqId: string) => addTopFaq(faqId))
}

export function useRemoveTopFaq() {
    return useFaqMutation((faqId: string) => removeTopFaq(faqId))
}
