import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    getBooking,
    listBookings,
    updateBooking,
    type BookingListParams,
} from '../services/bookingService'

export const bookingKeys = {
    all: ['bookings'] as const,
    list: (params: BookingListParams) => ['bookings', 'list', params] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
}

export function useBookings(params: BookingListParams, enabled = true) {
    return useQuery({
        queryKey: bookingKeys.list(params),
        queryFn: () => listBookings(params),
        placeholderData: keepPreviousData,
        enabled,
    })
}

export function useBooking(id: string | undefined, enabled = true) {
    return useQuery({
        queryKey: bookingKeys.detail(id ?? ''),
        queryFn: () => getBooking(id!),
        enabled: Boolean(id) && enabled,
    })
}

export function useUpdateBooking() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            input,
        }: {
            id: string
            input: { dueAt?: string | null; notes?: string | null }
        }) => updateBooking(id, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
            void queryClient.invalidateQueries({ queryKey: ['payments'] })
        },
    })
}
