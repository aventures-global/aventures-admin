export function safeNext(raw: string | null): string {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
    return raw
}
