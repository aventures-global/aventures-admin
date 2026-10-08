import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    createPartner,
    deletePartner,
    listPartners,
    reorderPartners,
    updatePartner,
    type Partner,
    type PartnerInput,
} from '../services/partnerService'

export const partnerKeys = {
    all: ['partners'] as const,
}

export function usePartners() {
    return useQuery({ queryKey: partnerKeys.all, queryFn: listPartners })
}

function usePartnerMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSettled: () => queryClient.invalidateQueries({ queryKey: partnerKeys.all }),
    })
}

export function useCreatePartner() {
    return usePartnerMutation((input: PartnerInput) => createPartner(input))
}

export function useUpdatePartner() {
    return usePartnerMutation(({ id, input }: { id: string; input: Partial<PartnerInput> }) =>
        updatePartner(id, input),
    )
}

export function useDeletePartner() {
    return usePartnerMutation((id: string) => deletePartner(id))
}

export function useReorderPartners() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (ids: string[]) => reorderPartners(ids),
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: partnerKeys.all })
            const previous = queryClient.getQueryData<Partner[]>(partnerKeys.all)
            if (previous) {
                const byId = new Map(previous.map((item) => [item.id, item]))
                queryClient.setQueryData<Partner[]>(
                    partnerKeys.all,
                    ids.flatMap((id) => byId.get(id) ?? []),
                )
            }
            return { previous }
        },
        onError: (_err, _ids, context) => {
            if (context?.previous) queryClient.setQueryData(partnerKeys.all, context.previous)
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: partnerKeys.all }),
    })
}
