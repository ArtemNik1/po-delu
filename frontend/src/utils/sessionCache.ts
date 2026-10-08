import type { Profile, UserSettings } from '../types/database'

const KEY = 'po-delu.session'

export interface SessionUser {
  id: string
  email: string
  displayName: string | null
}

export interface SessionSnapshot {
  user: SessionUser
  profile: Profile
  settings: UserSettings | null
}

export function writeSession(snapshot: SessionSnapshot): void {
  try {
    const settings = snapshot.settings ? { ...snapshot.settings, week_starts_on: 1 as const } : null
    localStorage.setItem(KEY, JSON.stringify({ ...snapshot, settings }))
  } catch {
    // A missing snapshot only means the next offline refresh asks to retry.
  }
}

export function readSession(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>
    if (!parsed.user || typeof parsed.user.id !== 'string' || typeof parsed.user.email !== 'string') return null
    if (!parsed.profile || typeof parsed.profile.id !== 'string') return null
    return {
      user: parsed.user,
      profile: parsed.profile,
      settings: parsed.settings ? { ...parsed.settings, week_starts_on: 1 } : null,
    }
  } catch {
    return null
  }
}

export function clearSessionCache(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignore storage failures.
  }
}

/** Reads the JWT subject without verifying the signature. Used only to avoid mixing accounts. */
export function tokenSubject(token: string): string | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const padded = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(padded)) as { sub?: unknown }
    return typeof json.sub === 'string' ? json.sub : null
  } catch {
    return null
  }
}
