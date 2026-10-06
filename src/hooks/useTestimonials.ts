import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    createTestimonial,
    deleteTestimonial,
    listTestimonials,
    reorderTestimonials,
    updateTestimonial,
    type Testimonial,
    type TestimonialInput,
} from '../services/testimonialService'

export const testimonialKeys = {
    all: ['testimonials'] as const,
}

export function useTestimonials() {
    return useQuery({ queryKey: testimonialKeys.all, queryFn: listTestimonials })
}

function useTestimonialMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSettled: () => queryClient.invalidateQueries({ queryKey: testimonialKeys.all }),
    })
}

export function useCreateTestimonial() {
    return useTestimonialMutation((input: TestimonialInput) => createTestimonial(input))
}

export function useUpdateTestimonial() {
    return useTestimonialMutation(({ id, input }: { id: string; input: Partial<TestimonialInput> }) =>
        updateTestimonial(id, input),
    )
}

export function useDeleteTestimonial() {
    return useTestimonialMutation((id: string) => deleteTestimonial(id))
}

export function useReorderTestimonials() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (ids: string[]) => reorderTestimonials(ids),
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: testimonialKeys.all })
            const previous = queryClient.getQueryData<Testimonial[]>(testimonialKeys.all)
            if (previous) {
                const byId = new Map(previous.map((item) => [item.id, item]))
                queryClient.setQueryData<Testimonial[]>(
                    testimonialKeys.all,
                    ids.flatMap((id) => byId.get(id) ?? []),
                )
            }
            return { previous }
        },
        onError: (_err, _ids, context) => {
            if (context?.previous) queryClient.setQueryData(testimonialKeys.all, context.previous)
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: testimonialKeys.all }),
    })
}
