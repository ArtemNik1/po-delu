const DAY_MS = 86_400_000

/** Local calendar day as `yyyy-MM-dd`, independent of timezone offsets. */
export function toIsoDay(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(now = new Date()): string {
  return toIsoDay(now)
}

/** Parses `yyyy-MM-dd` (or a timestamp) into a local Date at midnight. */
export function fromIsoDay(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

export function addIsoDays(value: string, days: number): string {
  const date = fromIsoDay(value)
  date.setDate(date.getDate() + days)
  return toIsoDay(date)
}

export function diffIsoDays(from: string, to: string): number {
  return Math.round((fromIsoDay(to).getTime() - fromIsoDay(from).getTime()) / DAY_MS)
}

/** Last day of the week containing `value`. `weekStartsOn`: 0 = Sunday, 1 = Monday. */
export function endOfIsoWeek(value: string, weekStartsOn: 0 | 1): string {
  const weekday = fromIsoDay(value).getDay()
  const offset = (weekday - weekStartsOn + 7) % 7
  return addIsoDays(value, 6 - offset)
}

/** Monday-first 6×7 cells for the month that contains `iso`. */
export function monthGrid(iso: string): string[] {
  const date = fromIsoDay(iso)
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const mondayOffset = (first.getDay() + 6) % 7
  const start = new Date(date.getFullYear(), date.getMonth(), 1 - mondayOffset)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return toIsoDay(day)
  })
}

/** Moves by calendar months, clamping the day when the target month is shorter. */
export function shiftMonth(iso: string, months: number): string {
  const date = fromIsoDay(iso)
  const day = date.getDate()
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, last))
  return toIsoDay(target)
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

export function isoRange(from: string, to: string): string[] {
  const days: string[] = []
  const total = diffIsoDays(from, to)
  for (let index = 0; index <= total; index += 1) days.push(addIsoDays(from, index))
  return days
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** Calendar day a timestamp or date column belongs to. */
export function timestampToIsoDay(value: string | null): string | null {
  if (!value) return null
  if (ISO_DAY.test(value)) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return toIsoDay(parsed)
}
