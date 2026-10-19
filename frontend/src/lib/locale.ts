import { setDefaultOptions } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'
import { setCurrentLanguage, writeStoredLanguage, type Language } from './i18n'

const DATE_LOCALES = { en: enUS, ru } as const

export function applyDateLocale(language: Language): void {
  setCurrentLanguage(language)
  writeStoredLanguage(language)
  setDefaultOptions({ locale: DATE_LOCALES[language], weekStartsOn: 1 })
}
