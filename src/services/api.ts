import axios, { AxiosError } from 'axios'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

if (!API_URL) {
    console.warn('VITE_API_URL is not set — API requests will fail until configured')
}

const REFRESH_MARGIN_MS = 60_000

let accessToken: string | null = null
let tokenRefresher: (() => Promise<string | null>) | null = null
let pendingRefresh: Promise<string | null> | null = null

export function setAccessToken(token: string | null) {
    accessToken = token
}

export function setTokenRefresher(refresher: (() => Promise<string | null>) | null) {
    tokenRefresher = refresher
}

function expiresSoon(token: string): boolean {
    const [, payload] = token.split('.')
    if (!payload) return false
    try {
        const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
            exp?: number
        }
        return typeof exp === 'number' && exp * 1000 - Date.now() < REFRESH_MARGIN_MS
    } catch {
        return false
    }
}

async function currentToken(): Promise<string | null> {
    if (!accessToken || !tokenRefresher || !expiresSoon(accessToken)) return accessToken
    pendingRefresh ??= tokenRefresher()
        .then((token) => {
            if (token) accessToken = token
            return accessToken
        })
        .finally(() => {
            pendingRefresh = null
        })
    return pendingRefresh
}

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
    const token = await currentToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: { message?: string } }>) => {
        const status = error.response?.status
        const message =
            error.response?.data?.error?.message ??
            (status ? `Request failed (${status})` : error.message)
        return Promise.reject(new Error(message))
    },
)
