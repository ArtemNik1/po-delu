import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { getApiErrorMessage } from './apiErrors'

export { getApiErrorMessage }

const TOKEN_KEY = 'po-delu.accessToken'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore storage failures.
  }
}

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let handlingUnauthorized = false

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !handlingUnauthorized) {
      const url = error.config?.url ?? ''
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
      if (!isAuthEndpoint) {
        handlingUnauthorized = true
        setStoredToken(null)
        window.dispatchEvent(new CustomEvent('po-delu:unauthorized'))
        if (!window.location.hash.includes('/login')) {
          window.location.hash = '#/login'
        }
        voidHandlingUnauthorized()
      }
    }
    return Promise.reject(error)
  },
)

function voidHandlingUnauthorized() {
  window.setTimeout(() => {
    handlingUnauthorized = false
  }, 500)
}
