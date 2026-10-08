import { useCallback } from 'react'
import {
  getCurrentLanguage,
  translateIn,
  type Language,
  type TranslationKey,
  type TranslationVars,
} from '../lib/i18n'
import { useAuthStore } from '../store/authStore'

export type Translate = (key: TranslationKey, vars?: TranslationVars) => string

/**
 * Reads the active language from the user's settings when set, otherwise the
 * module-level language (browser/storage preference applied in `main.tsx` and
 * `applyLanguage`). `localeEpoch` forces a re-render when language changes.
 */
export function useLanguage(): Language {
  useAuthStore((state) => state.localeEpoch)
  return useAuthStore((state) => state.settings?.language ?? getCurrentLanguage())
}

export function useTranslation(): { t: Translate; language: Language } {
  const language = useLanguage()
  const t = useCallback<Translate>((key, vars) => translateIn(language, key, vars), [language])
  return { t, language }
}
