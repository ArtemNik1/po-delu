import { describe, expect, it } from 'vitest'
import {
  addIsoDays,
  diffIsoDays,
  endOfIsoWeek,
  isoRange,
  monthGrid,
  shiftMonth,
  timestampToIsoDay,
  toIsoDay,
} from '../isoDate'

describe('isoDate', () => {
  it('formats a local date without shifting the day', () => {
    expect(toIsoDay(new Date(2026, 8, 3, 23, 59))).toBe('2026-09-03')
    expect(toIsoDay(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
  })

  it('adds and subtracts days across month and year boundaries', () => {
    expect(addIsoDays('2026-09-03', 1)).toBe('2026-09-04')
    expect(addIsoDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addIsoDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('handles leap years', () => {
    expect(addIsoDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addIsoDays('2026-02-28', 1)).toBe('2026-03-01')
  })

  it('measures day distance', () => {
    expect(diffIsoDays('2026-09-03', '2026-09-10')).toBe(7)
    expect(diffIsoDays('2026-09-10', '2026-09-03')).toBe(-7)
    expect(diffIsoDays('2026-09-03', '2026-09-03')).toBe(0)
  })

  it('finds the end of the week for both week starts', () => {
    expect(endOfIsoWeek('2026-09-03', 1)).toBe('2026-09-06')
    expect(endOfIsoWeek('2026-09-03', 0)).toBe('2026-09-05')
  })

  it('builds an inclusive range', () => {
    expect(isoRange('2026-09-01', '2026-09-03')).toEqual(['2026-09-01', '2026-09-02', '2026-09-03'])
    expect(isoRange('2026-09-01', '2026-09-01')).toEqual(['2026-09-01'])
  })

  it('reaches dates 11, 30 and 90 days ahead without a UTC shift', () => {
    expect(addIsoDays('2026-10-02', 11)).toBe('2026-10-13')
    expect(addIsoDays('2026-10-02', 30)).toBe('2026-11-01')
    expect(addIsoDays('2026-10-02', 90)).toBe('2026-12-31')
  })

  it('builds a Monday-first month and steps across years', () => {
    const cells = monthGrid('2026-10-15')
    expect(cells).toHaveLength(42)
    expect(new Date(2026, 8, 28).getDay()).toBe(1)
    expect(cells[0]).toBe('2026-09-28')
    expect(shiftMonth('2026-12-15', 1)).toBe('2027-01-15')
    expect(shiftMonth('2026-01-31', 1)).toBe('2026-02-28')
    expect(shiftMonth('2026-03-01', -1)).toBe('2026-02-01')
  })

  it('converts timestamps and passes through date columns', () => {
    expect(timestampToIsoDay('2026-09-03')).toBe('2026-09-03')
    expect(timestampToIsoDay(null)).toBeNull()
    expect(timestampToIsoDay('not-a-date')).toBeNull()
  })
})
