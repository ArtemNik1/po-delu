const LOCAL_KEYS = [
  ['nexora.accessToken', 'po-delu.accessToken'],
  ['nexora.language', 'po-delu.language'],
  ['nexora.session', 'po-delu.session'],
  ['nexora.sidebar.collapsed', 'po-delu.sidebar.collapsed'],
  ['nexora.hint.dismissed', 'po-delu.hint.dismissed'],
] as const

const SESSION_KEYS = [
  ['nexora.focus.session', 'po-delu.focus.session'],
  ['nexora.drafts', 'po-delu.drafts'],
] as const

const CACHE_FROM = 'nexora.cache.v2.'
const CACHE_TO = 'po-delu.cache.v2.'

function migrateKey(storage: Storage, from: string, to: string): void {
  let previous: string | null
  let current: string | null
  try {
    previous = storage.getItem(from)
    current = storage.getItem(to)
  } catch {
    return
  }
  if (previous === null) return
  if (current === null) {
    try {
      storage.setItem(to, previous)
    } catch {
      return
    }
  }
  try {
    storage.removeItem(from)
  } catch {
    // The new key is already stored. Leave the old one only if deletion fails.
  }
}

function migratePrefix(storage: Storage, fromPrefix: string, toPrefix: string): void {
  const keys: string[] = []
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (key?.startsWith(fromPrefix)) keys.push(key)
    }
  } catch {
    return
  }
  for (const key of keys) migrateKey(storage, key, toPrefix + key.slice(fromPrefix.length))
}

/** Copies nexora.* browser storage once. A newer po-delu.* value wins. */
export function migrateLegacyStorage(): void {
  try {
    for (const [from, to] of LOCAL_KEYS) migrateKey(localStorage, from, to)
    migratePrefix(localStorage, CACHE_FROM, CACHE_TO)
  } catch {
    // Storage can be blocked; the app still starts.
  }
  try {
    for (const [from, to] of SESSION_KEYS) migrateKey(sessionStorage, from, to)
  } catch {
    // Session storage is optional.
  }
}

migrateLegacyStorage()
