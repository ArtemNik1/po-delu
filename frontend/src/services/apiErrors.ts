import axios from 'axios'
import { translate } from '../lib/i18n'

const MESSAGE_MAP: Array<{ match: RegExp; key: Parameters<typeof translate>[0] }> = [
  { match: /task not found/i, key: 'api.error.taskNotFound' },
  { match: /invalid email or password|invalid credentials/i, key: 'api.error.invalidCredentials' },
  {
    match: /email is already registered|already exists|unique constraint|duplicate/i,
    key: 'api.error.emailExists',
  },
  { match: /unauthorized|jwt expired|invalid token|jwt malformed/i, key: 'api.error.unauthorized' },
  { match: /network error|failed to fetch|timeout|econnrefused/i, key: 'api.error.network' },
  { match: /not found/i, key: 'api.error.notFound' },
  { match: /forbidden|access denied/i, key: 'api.error.forbidden' },
  { match: /conflict/i, key: 'api.error.conflict' },
]

function mapKnownMessage(message: string): string | null {
  for (const entry of MESSAGE_MAP) {
    if (entry.match.test(message)) return translate(entry.key)
  }
  return null
}

/** Localizes backend/Axios errors for toast and form display. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return translate('api.error.network')

    const status = error.response.status
    const data = error.response.data as { message?: string | string[] } | undefined
    const raw = Array.isArray(data?.message)
      ? data.message.join(', ')
      : typeof data?.message === 'string'
        ? data.message
        : error.message

    const mapped = raw ? mapKnownMessage(raw) : null
    if (mapped) return mapped

    if (status === 401) return translate('api.error.unauthorized')
    if (status === 403) return translate('api.error.forbidden')
    if (status === 404) return translate('api.error.notFound')
    if (status === 409) return translate('api.error.conflict')
    if (status === 400 || status === 422) return translate('api.error.validation')
    if (status >= 500) return translate('api.error.server')

    if (raw && !/^[A-Z_]+$/.test(raw) && raw.length < 160) {
      // Prefer a short human message from the API when it is already safe.
      const known = mapKnownMessage(raw)
      if (known) return known
    }
  }

  if (error instanceof Error) {
    const mapped = mapKnownMessage(error.message)
    if (mapped) return mapped
  }

  return translate('error.generic')
}
