import { describe, expect, it } from 'vitest'
import type { Task } from '../../types/database'
import { computeAnalytics } from '../analytics'
import { addIsoDays, fromIsoDay } from '../isoDate'

const TODAY = '2026-09-03'

function completedAtOn(day: string): string {
  const date = fromIsoDay(day)
  date.setHours(12, 0, 0, 0)
  return date.toISOString()
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    userId: 'user-1',
    title: 'Task',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: TODAY,
    dueTime: null,
    estimatedMinutes: null,
    categoryId: null,
    sortOrder: 0,
    completedAt: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

function done(day: string, overrides: Partial<Task> = {}): Task {
  return task({ status: 'done', dueDate: day, completedAt: completedAtOn(day), ...overrides })
}

describe('computeAnalytics', () => {
  it('returns a neutral summary for an empty account', () => {
    const summary = computeAnalytics([], 5, TODAY)
    expect(summary.completedToday).toBe(0)
    expect(summary.completedThisWeek).toBe(0)
    expect(summary.completionRate).toBe(0)
    expect(summary.averagePerDay).toBe(0)
    expect(summary.streaks).toEqual({ current: 0, best: 0 })
    expect(summary.last7Days).toHaveLength(7)
    expect(summary.score).toBeGreaterThanOrEqual(0)
  })

  it('counts today and the trailing week', () => {
    const summary = computeAnalytics(
      [done(TODAY), done(TODAY), done('2026-09-01'), done('2026-08-01')],
      5,
      TODAY,
    )
    expect(summary.completedToday).toBe(2)
    expect(summary.completedThisWeek).toBe(3)
    expect(summary.averagePerDay).toBeCloseTo(3 / 7)
  })

  it('measures completion rate against scheduled work only', () => {
    const summary = computeAnalytics(
      [done(TODAY), task({ dueDate: TODAY }), task({ dueDate: '2026-01-01' })],
      5,
      TODAY,
    )
    expect(summary.completionRate).toBe(0.5)
  })

  it('sums estimated focus time for the window', () => {
    const summary = computeAnalytics(
      [done(TODAY, { estimatedMinutes: 50 }), done('2026-09-02', { estimatedMinutes: 25 }), done('2026-01-01', { estimatedMinutes: 90 })],
      5,
      TODAY,
    )
    expect(summary.focusMinutes).toBe(75)
  })

  it('counts overdue tasks', () => {
    const summary = computeAnalytics(
      [task({ dueDate: '2026-09-01' }), done('2026-09-01'), task({ dueDate: TODAY })],
      5,
      TODAY,
    )
    expect(summary.overdueCount).toBe(1)
  })

  it('produces an ordered 7-day series ending today', () => {
    const summary = computeAnalytics([done(TODAY)], 5, TODAY)
    expect(summary.last7Days[0]?.day).toBe('2026-08-28')
    expect(summary.last7Days.at(-1)).toEqual({ day: TODAY, value: 1 })
  })

  it('builds a heatmap covering 120 days', () => {
    const summary = computeAnalytics([], 5, TODAY)
    expect(summary.heatmap).toHaveLength(120)
    expect(summary.heatmap.at(-1)?.day).toBe(TODAY)
  })

  it('ignores due, created and updated dates when the completion stamp is missing', () => {
    const summary = computeAnalytics(
      [
        task({
          status: 'done',
          dueDate: TODAY,
          createdAt: `${TODAY}T08:00:00.000Z`,
          updatedAt: `${TODAY}T09:00:00.000Z`,
          completedAt: null,
          estimatedMinutes: 40,
        }),
      ],
      1,
      TODAY,
    )
    expect(summary.completedToday).toBe(0)
    expect(summary.completedThisWeek).toBe(0)
    expect(summary.averagePerDay).toBe(0)
    expect(summary.focusMinutes).toBe(0)
    expect(summary.streaks).toEqual({ current: 0, best: 0 })
    expect(summary.last7Days.every((point) => point.value === 0)).toBe(true)
    expect(summary.heatmap.every((point) => point.value === 0)).toBe(true)
  })

  it('counts a streak from consecutive completion days', () => {
    const summary = computeAnalytics(
      [done(TODAY), done(addIsoDays(TODAY, -1)), done(addIsoDays(TODAY, -2))],
      1,
      TODAY,
    )
    expect(summary.streaks).toEqual({ current: 3, best: 3 })
    expect(summary.last7Days.at(-1)?.value).toBe(1)
    expect(summary.last7Days.at(-2)?.value).toBe(1)
  })
})
