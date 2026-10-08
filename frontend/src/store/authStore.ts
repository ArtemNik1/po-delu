import axios from 'axios'
import { create } from 'zustand'
import { detectLanguage, translate, type Language } from '../lib/i18n'
import { applyDateLocale } from '../lib/locale'
import { THEME_COLOR, resolveTheme } from '../lib/theme'
import { authApi } from '../services/authApi'
import { getApiErrorMessage, getStoredToken, setStoredToken } from '../services/api'
import type { Profile, UserSettings } from '../types/database'
import { clearSessionCache, readSession, tokenSubject, writeSession } from '../utils/sessionCache'
import { useDataStore } from './dataStore'
import { useDraftStore } from './draftStore'
import { toast } from './toastStore'

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
}

export interface AuthResult {
  error?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  profile: Profile | null
  settings: UserSettings | null
  initialized: boolean
  profileLoading: boolean
  submitting: boolean
  offline: boolean
  error: string | null
  /** Bumped whenever the active UI language changes so subscribers re-render. */
  localeEpoch: number
  initialize: () => Promise<void>
  retrySession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => Promise<boolean>
  updateSettings: (patch: Partial<UserSettings>) => Promise<boolean>
  applyTheme: (theme?: string | null) => void
  applyLanguage: (language?: Language | null) => void
}

function defaultSettings(userId: string): UserSettings {
  const now = new Date().toISOString()
  return {
    user_id: userId,
    theme: 'dark',
    language: null,
    week_starts_on: 1,
    daily_goal: 5,
    sound_enabled: true,
    onboarding_completed: false,
    created_at: now,
    updated_at: now,
  }
}

function storedSettings(settings: UserSettings | null, userId: string): UserSettings {
  const next = settings ?? defaultSettings(userId)
  return { ...next, theme: resolveTheme(next.theme), week_starts_on: 1 }
}

let settingsEpoch = 0
let settingsChain: Promise<unknown> = Promise.resolve()
let confirmedSettings: UserSettings | null = null
let profileEpoch = 0
let profileChain: Promise<unknown> = Promise.resolve()
let confirmedProfile: Profile | null = null
let confirmedUser: AuthUser | null = null

function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}

function rememberSession(get: () => AuthState) {
  const { user, profile, settings } = get()
  if (!user || !profile) return
  confirmedSettings = settings
  confirmedProfile = profile
  confirmedUser = user
  writeSession({ user, profile, settings })
}

function clearSession(set: (partial: Partial<AuthState>) => void, get: () => AuthState) {
  const userId = get().user?.id
  if (userId) useDraftStore.getState().clearUser(userId)
  setStoredToken(null)
  clearSessionCache()
  confirmedSettings = null
  confirmedProfile = null
  confirmedUser = null
  settingsEpoch += 1
  profileEpoch += 1
  set({ token: null, user: null, profile: null, settings: null, error: null, offline: false })
  useDataStore.getState().reset()
  get().applyTheme('dark')
  get().applyLanguage(null)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  profile: null,
  settings: null,
  initialized: false,
  profileLoading: false,
  submitting: false,
  offline: false,
  error: null,
  localeEpoch: 0,

  applyTheme: (theme) => {
    const resolved = resolveTheme(theme ?? get().settings?.theme)
    document.documentElement.dataset.theme = resolved
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved])
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', resolved === 'light' ? 'light' : 'dark')
  },

  applyLanguage: (language) => {
    const resolved = (language === undefined ? get().settings?.language : language) ?? detectLanguage()
    applyDateLocale(resolved)
    document.documentElement.lang = resolved
    set({ localeEpoch: get().localeEpoch + 1 })
  },

  initialize: async () => {
    get().applyTheme('dark')
    get().applyLanguage()

    window.addEventListener('po-delu:unauthorized', () => {
      if (get().user) clearSession(set, get)
    })

    const token = getStoredToken()
    if (!token) {
      set({ initialized: true, offline: false })
      return
    }

    set({ token, profileLoading: true })
    try {
      const me = await authApi.me()
      const settings = storedSettings(me.settings, me.id)
      set({
        user: { id: me.id, email: me.email, displayName: me.displayName },
        profile: me.profile,
        settings,
        profileLoading: false,
        initialized: true,
        offline: false,
      })
      get().applyTheme(settings.theme)
      get().applyLanguage(settings.language ?? null)
      rememberSession(get)
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession(set, get)
        set({ profileLoading: false, initialized: true })
        return
      }
      const cached = readSession()
      const subject = tokenSubject(token)
      const sameAccount = cached && (!subject || cached.user.id === subject)
      if (sameAccount && cached) {
        const settings = storedSettings(cached.settings, cached.user.id)
        set({
          user: cached.user,
          profile: cached.profile,
          settings,
          profileLoading: false,
          initialized: true,
          offline: true,
        })
        get().applyTheme(settings.theme)
        get().applyLanguage(settings.language ?? null)
        return
      }
      set({ profileLoading: false, initialized: true, offline: true })
    }
  },

  retrySession: async () => {
    const token = get().token ?? getStoredToken()
    if (!token) return
    set({ token, profileLoading: true })
    try {
      const me = await authApi.me()
      const settings = storedSettings(me.settings, me.id)
      set({
        user: { id: me.id, email: me.email, displayName: me.displayName },
        profile: me.profile,
        settings,
        profileLoading: false,
        initialized: true,
        offline: false,
      })
      get().applyTheme(settings.theme)
      get().applyLanguage(settings.language ?? null)
      rememberSession(get)
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession(set, get)
        set({ profileLoading: false, initialized: true })
        return
      }
      set({ profileLoading: false, initialized: true, offline: true })
    }
  },

  signIn: async (email, password) => {
    set({ submitting: true, error: null })
    try {
      const result = await authApi.login({ email: email.trim(), password })
      setStoredToken(result.accessToken)
      useDataStore.getState().reset()
      const me = await authApi.me()
      const settings = storedSettings(me.settings, me.id)
      set({
        token: result.accessToken,
        user: { id: me.id, email: me.email, displayName: me.displayName },
        profile: me.profile,
        settings,
        submitting: false,
        offline: false,
      })
      get().applyTheme(settings.theme)
      get().applyLanguage(settings.language ?? null)
      rememberSession(get)
      return {}
    } catch (error) {
      const message = getApiErrorMessage(error)
      set({ submitting: false, error: message })
      return { error: message }
    }
  },

  signUp: async (email, password, displayName) => {
    set({ submitting: true, error: null })
    try {
      const result = await authApi.register({
        email: email.trim(),
        password,
        displayName,
      })
      setStoredToken(result.accessToken)
      useDataStore.getState().reset()
      const me = await authApi.me()
      const settings = storedSettings(me.settings, me.id)
      set({
        token: result.accessToken,
        user: { id: me.id, email: me.email, displayName: me.displayName },
        profile: me.profile,
        settings,
        submitting: false,
        offline: false,
      })
      get().applyTheme(settings.theme)
      get().applyLanguage(settings.language ?? null)
      rememberSession(get)
      return {}
    } catch (error) {
      const message = getApiErrorMessage(error)
      set({ submitting: false, error: message })
      return { error: message }
    }
  },

  signOut: async () => {
    clearSession(set, get)
  },

  updateProfile: (patch) => {
    const userId = get().user?.id
    const previousProfile = get().profile
    const previousUser = get().user
    if (!userId || !previousProfile || !previousUser) return Promise.resolve(false)
    if (!confirmedProfile) confirmedProfile = previousProfile
    if (!confirmedUser) confirmedUser = previousUser

    const epoch = ++profileEpoch
    set({
      profile: { ...previousProfile, display_name: patch.display_name ?? previousProfile.display_name },
      user: { ...previousUser, displayName: patch.display_name ?? previousUser.displayName },
    })

    const work = async (): Promise<boolean> => {
      try {
        const me = await authApi.updateProfile({ displayName: patch.display_name ?? undefined })
        const latest = epoch === profileEpoch && get().user?.id === userId
        const profile = me.profile
        const user = { id: me.id, email: me.email, displayName: me.displayName }
        confirmedProfile = profile
        confirmedUser = user
        if (!latest) return true
        set({ profile, user, settings: me.settings ? storedSettings(me.settings, user.id) : get().settings })
        rememberSession(get)
        return true
      } catch (error) {
        if (epoch !== profileEpoch || get().user?.id !== userId) return false
        set({ profile: confirmedProfile, user: confirmedUser })
        toast({ kind: 'error', title: translate('error.updateProfile'), description: getApiErrorMessage(error) })
        return false
      }
    }

    const run = profileChain.then(work, work)
    profileChain = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  },

  updateSettings: (patch) => {
    const user = get().user
    if (!user) return Promise.resolve(false)
    const previous = get().settings
    if (!confirmedSettings) confirmedSettings = previous

    const epoch = ++settingsEpoch
    const userId = user.id
    const next: UserSettings = storedSettings(
      { ...(previous ?? defaultSettings(user.id)), ...patch, week_starts_on: 1 },
      user.id,
    )
    set({ settings: next })
    if (patch.theme) get().applyTheme(patch.theme)
    if (patch.language !== undefined) get().applyLanguage(patch.language)

    const work = async (): Promise<boolean> => {
      try {
        const me = await authApi.updateSettings({
          theme: next.theme,
          language: next.language,
          weekStartsOn: 1,
          dailyGoal: next.daily_goal,
          soundEnabled: next.sound_enabled,
          onboardingCompleted: next.onboarding_completed,
        })
        const settings = me.settings ? storedSettings(me.settings, userId) : next
        confirmedSettings = settings
        if (epoch !== settingsEpoch || get().user?.id !== userId) return true
        set({ settings })
        get().applyTheme(settings.theme)
        get().applyLanguage(settings.language ?? null)
        rememberSession(get)
        return true
      } catch (error) {
        if (epoch !== settingsEpoch || get().user?.id !== userId) return false
        const rollback = confirmedSettings
        set({ settings: rollback })
        get().applyTheme(rollback?.theme ?? 'dark')
        get().applyLanguage(rollback?.language ?? null)
        toast({ kind: 'error', title: translate('error.saveSettings'), description: getApiErrorMessage(error) })
        return false
      }
    }

    const run = settingsChain.then(work, work)
    settingsChain = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  },
}))
