import { format } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'
import { getCurrentLanguage, translate, type Language, type TranslationKey } from '../lib/i18n'
import { addIsoDays, fromIsoDay, todayIso } from './isoDate'

export { todayIso, addIsoDays, fromIsoDay }

export function addDaysIso(days: number, from = todayIso()): string {
  return addIsoDays(from, days)
}

// Russian puts the day before the month and needs the genitive month form,
// which date-fns produces for `MMMM` (formatting) rather than `LLLL` (standalone).
const LONG_DATE: Record<Language, string> = { en: 'EEEE, MMMM d', ru: 'EEEE, d MMMM' }
const SHORT_DATE: Record<Language, string> = { en: 'MMM d', ru: 'd MMM' }

export function formatLongDate(value: Date | string): string {
  const date = typeof value === 'string' ? fromIsoDay(value) : value
  return format(date, LONG_DATE[getCurrentLanguage()])
}

export function formatShortDate(value: Date | string): string {
  const date = typeof value === 'string' ? fromIsoDay(value) : value
  return format(date, SHORT_DATE[getCurrentLanguage()])
}

export function formatMonthYear(value: string): string {
  const date = fromIsoDay(value)
  return format(date, getCurrentLanguage() === 'ru' ? 'LLLL yyyy' : 'MMMM yyyy')
}

export function formatWeekday(value: string, language: Language = getCurrentLanguage()): string {
  return format(fromIsoDay(value), 'EEE', { locale: language === 'en' ? enUS : ru })
}

/** `HH:mm` from a Postgres `time` value. */
export function formatTime(value: string | null): string | null {
  if (!value) return null
  const [hours, minutes] = value.split(':')
  if (hours === undefined || minutes === undefined) return value
  return `${hours.padStart(2, '0')}:${minutes.slice(0, 2)}`
}

/** Time-of-day greeting as a translation key. */
export function greetingKey(date = new Date()): TranslationKey {
  const hour = date.getHours()
  if (hour < 12) return 'greeting.morning'
  if (hour < 18) return 'greeting.afternoon'
  return 'greeting.evening'
}

export function firstName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const raw = displayName?.trim() || email?.split('@')[0] || translate('common.you')
  return raw.split(' ')[0] ?? raw
}

export function durationLabel(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes < 0) return null
  const hourUnit = translate('unit.hourShort')
  const minuteUnit = translate('unit.minuteShort')
  if (minutes < 60) return `${minutes}${minuteUnit}`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}${hourUnit} ${rest}${minuteUnit}` : `${hours}${hourUnit}`
}

export function relativeDateLabel(value: string, today = todayIso()): string {
  if (value === today) return translate('common.today')
  if (value === addIsoDays(today, 1)) return translate('common.tomorrow')
  if (value === addIsoDays(today, -1)) return translate('common.yesterday')
  return formatShortDate(value)
}
