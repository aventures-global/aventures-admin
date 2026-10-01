import { api } from './api'

export type UploadResult = {
    key: string
    url: string
    contentType: string
}

export async function uploadImage(file: File, folder = 'tours'): Promise<string> {
    const form = new FormData()
    form.append('folder', folder)
    form.append('file', file)
    const { data } = await api.post<UploadResult>('/api/uploads', form)
    return data.url
}
