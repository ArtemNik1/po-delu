import { setDefaultOptions } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'
import { setCurrentLanguage, writeStoredLanguage, type Language } from './i18n'

const DATE_LOCALES = { en: enUS, ru } as const

/**
 * Applies a language globally: date-fns formatting plus the module-level
 * language used by `translate()` in stores and utilities. Called from the auth
 * store whenever settings load or change, so it always runs before a render.
 */
export function applyDateLocale(language: Language): void {
  setCurrentLanguage(language)
  writeStoredLanguage(language)
  setDefaultOptions({ locale: DATE_LOCALES[language], weekStartsOn: 1 })
}
