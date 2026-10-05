import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getVisaCatalog, updateVisaFinder, updateVisaPage, updateVisaService } from '../services/visaService'
import type {
    VisaCatalog,
    VisaFinderInput,
    VisaId,
    VisaPageInput,
    VisaPageSlug,
    VisaServiceInput,
} from '../types/visa'

export const visaKeys = {
    catalog: ['visa', 'catalog'] as const,
}

export function useVisaCatalog() {
    return useQuery({ queryKey: visaKeys.catalog, queryFn: getVisaCatalog })
}

function useVisaMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<VisaCatalog>) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSuccess: (catalog) => queryClient.setQueryData(visaKeys.catalog, catalog),
    })
}

export function useUpdateVisaPage() {
    return useVisaMutation(({ slug, input }: { slug: VisaPageSlug; input: VisaPageInput }) =>
        updateVisaPage(slug, input),
    )
}

export function useUpdateVisaService() {
    return useVisaMutation(({ id, input }: { id: VisaId; input: Partial<VisaServiceInput> }) =>
        updateVisaService(id, input),
    )
}

export function useUpdateVisaFinder() {
    return useVisaMutation((input: VisaFinderInput) => updateVisaFinder(input))
}
