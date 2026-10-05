import { api } from './api'

export type UploadResult = {
    key: string
    url: string
    contentType: string
}

async function uploadFile(file: File, folder: string): Promise<string> {
    const form = new FormData()
    form.append('folder', folder)
    form.append('file', file)
    const { data } = await api.post<UploadResult>('/api/uploads', form)
    return data.url
}

export async function uploadImage(file: File, folder = 'tours'): Promise<string> {
    return uploadFile(file, folder)
}

export async function uploadPdf(file: File, folder = 'visa-checklists'): Promise<string> {
    return uploadFile(file, folder)
}
