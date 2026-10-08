import { describe, expect, it } from 'vitest'
import { calculateProductivityScore, computeStreaks } from '../productivity'

const TODAY = '2026-09-03'

describe('calculateProductivityScore', () => {
  it('returns 0 when nothing is done and work is overdue', () => {
    expect(
      calculateProductivityScore({
        completedToday: 0,
        dailyGoal: 5,
        completionRate: 0,
        currentStreak: 0,
        overdueCount: 20,
      }),
    ).toBe(0)
  })

  it('returns 100 for a perfect day', () => {
    expect(
      calculateProductivityScore({
        completedToday: 5,
        dailyGoal: 5,
        completionRate: 1,
        currentStreak: 14,
        overdueCount: 0,
      }),
    ).toBe(100)
  })

  it('stays within 0-100 for out-of-range input', () => {
    const score = calculateProductivityScore({
      completedToday: 999,
      dailyGoal: 1,
      completionRate: 4,
      currentStreak: 900,
      overdueCount: -5,
    })
    expect(score).toBe(100)
  })

  it('never divides by zero when the goal is missing', () => {
    const score = calculateProductivityScore({
      completedToday: 2,
      dailyGoal: 0,
      completionRate: 0.5,
      currentStreak: 0,
      overdueCount: 0,
    })
    expect(score).toBeGreaterThan(0)
    expect(Number.isFinite(score)).toBe(true)
  })

  it('rewards a longer streak', () => {
    const base = { completedToday: 2, dailyGoal: 5, completionRate: 0.5, overdueCount: 0 }
    const low = calculateProductivityScore({ ...base, currentStreak: 1 })
    const high = calculateProductivityScore({ ...base, currentStreak: 10 })
    expect(high).toBeGreaterThan(low)
  })
})

describe('computeStreaks', () => {
  it('returns zeros without history', () => {
    expect(computeStreaks(new Map(), 3, TODAY)).toEqual({ current: 0, best: 0 })
  })

  it('counts consecutive days that reach the goal', () => {
    const counts = new Map([
      ['2026-09-01', 3],
      ['2026-09-02', 4],
      ['2026-09-03', 5],
    ])
    expect(computeStreaks(counts, 3, TODAY)).toEqual({ current: 3, best: 3 })
  })

  it('ignores days below the goal', () => {
    const counts = new Map([
      ['2026-09-01', 5],
      ['2026-09-02', 1],
      ['2026-09-03', 5],
    ])
    expect(computeStreaks(counts, 3, TODAY)).toEqual({ current: 1, best: 1 })
  })

  it('keeps the streak alive while today is still unfinished', () => {
    const counts = new Map([
      ['2026-09-01', 5],
      ['2026-09-02', 5],
      ['2026-09-03', 1],
    ])
    expect(computeStreaks(counts, 3, TODAY).current).toBe(2)
  })

  it('breaks the current streak after a missed day', () => {
    const counts = new Map([
      ['2026-08-28', 5],
      ['2026-08-29', 5],
      ['2026-08-30', 5],
    ])
    expect(computeStreaks(counts, 3, TODAY)).toEqual({ current: 0, best: 3 })
  })

  it('reports the best historical streak alongside a shorter current one', () => {
    const counts = new Map([
      ['2026-08-20', 5],
      ['2026-08-21', 5],
      ['2026-08-22', 5],
      ['2026-08-23', 5],
      ['2026-09-02', 5],
      ['2026-09-03', 5],
    ])
    expect(computeStreaks(counts, 3, TODAY)).toEqual({ current: 2, best: 4 })
  })

  it('handles a month boundary', () => {
    const counts = new Map([
      ['2026-08-31', 5],
      ['2026-09-01', 5],
      ['2026-09-02', 5],
      ['2026-09-03', 5],
    ])
    expect(computeStreaks(counts, 5, TODAY).current).toBe(4)
  })
})
