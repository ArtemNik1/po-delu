import type { Task } from '../types/database'
import { addIsoDays, isoRange } from './isoDate'
import { calculateProductivityScore, computeStreaks, type Streaks } from './productivity'
import { completedByDay, completionDay, isDone, isOverdue } from './tasks'

export interface DayPoint {
  day: string
  value: number
}

export interface AnalyticsSummary {
  completedToday: number
  completedThisWeek: number
  completionRate: number
  streaks: Streaks
  averagePerDay: number
  focusMinutes: number
  overdueCount: number
  score: number
  last7Days: DayPoint[]
  heatmap: DayPoint[]
}

export const BAR_TRACK_PX = 128

/** Pixel height of a bar. Zero stays a hairline; larger values are strictly taller. */
export function barHeightPx(value: number, max: number, track = BAR_TRACK_PX): number {
  if (value <= 0 || max <= 0) return 2
  return Math.max(8, Math.round((value / max) * track))
}

const WINDOW_DAYS = 7
const HEATMAP_DAYS = 119

export function computeAnalytics(tasks: Task[], dailyGoal: number, today: string): AnalyticsSummary {
  const counts = completedByDay(tasks)
  const windowStart = addIsoDays(today, -(WINDOW_DAYS - 1))
  const windowDays = isoRange(windowStart, today)

  const completedToday = counts.get(today) ?? 0
  const completedThisWeek = windowDays.reduce((sum, day) => sum + (counts.get(day) ?? 0), 0)

  // Rate is measured against work actually scheduled in the window, so unplanned
  // days neither inflate nor deflate the number.
  const scheduled = tasks.filter((task) => task.dueDate >= windowStart && task.dueDate <= today)
  const scheduledDone = scheduled.filter((task) => isDone(task)).length
  const completionRate = scheduled.length > 0 ? scheduledDone / scheduled.length : 0

  const focusMinutes = tasks
    .filter((task) => {
      const day = completionDay(task)
      return day !== null && day >= windowStart && day <= today
    })
    .reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0)

  const overdueCount = tasks.filter((task) => isOverdue(task, today)).length
  const streaks = computeStreaks(counts, dailyGoal, today)

  return {
    completedToday,
    completedThisWeek,
    completionRate,
    streaks,
    averagePerDay: completedThisWeek / WINDOW_DAYS,
    focusMinutes,
    overdueCount,
    score: calculateProductivityScore({
      completedToday,
      dailyGoal,
      completionRate,
      currentStreak: streaks.current,
      overdueCount,
    }),
    last7Days: windowDays.map((day) => ({ day, value: counts.get(day) ?? 0 })),
    heatmap: isoRange(addIsoDays(today, -HEATMAP_DAYS), today).map((day) => ({
      day,
      value: counts.get(day) ?? 0,
    })),
  }
}
