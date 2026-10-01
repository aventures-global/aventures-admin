import { useMutation } from '@tanstack/react-query'

import { uploadImage } from '../services/uploadService'

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml'

const MAX_BYTES = 8 * 1024 * 1024

export function useImageUpload(folder = 'tours') {
    const mutation = useMutation({
        mutationFn: async (file: File) => {
            if (file.size > MAX_BYTES) {
                throw new Error('Image is larger than 8 MB')
            }
            return uploadImage(file, folder)
        },
    })

    const upload = async (file: File): Promise<string | null> => {
        try {
            return await mutation.mutateAsync(file)
        } catch {
            return null
        }
    }

    return {
        upload,
        isUploading: mutation.isPending,
        error: mutation.error instanceof Error ? mutation.error.message : null,
        reset: mutation.reset,
    }
}
