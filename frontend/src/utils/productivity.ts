import { addIsoDays } from './isoDate'

export interface ProductivityInput {
  completedToday: number
  dailyGoal: number
  completionRate: number
  currentStreak: number
  overdueCount: number
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

/**
 * Productivity score, 0-100:
 *   40 pts — 7-day completion rate
 *   25 pts — progress against today's daily goal
 *   25 pts — current streak, saturating at 14 days
 *   10 pts — overdue penalty, empty at 8+ overdue tasks
 */
export function calculateProductivityScore(input: ProductivityInput): number {
  const goal = Math.max(input.dailyGoal, 1)
  const rateScore = clamp(input.completionRate, 0, 1) * 40
  const goalScore = clamp(input.completedToday / goal, 0, 1) * 25
  const streakScore = clamp(input.currentStreak / 14, 0, 1) * 25
  const overdueScore = (1 - clamp(input.overdueCount / 8, 0, 1)) * 10
  return Math.round(clamp(rateScore + goalScore + streakScore + overdueScore, 0, 100))
}

export interface Streaks {
  current: number
  best: number
}

/**
 * A day counts when at least `dailyGoal` tasks were completed.
 * The current streak ignores today while it is still unfinished, so an
 * in-progress day never breaks an otherwise healthy streak.
 */
export function computeStreaks(
  completedByDay: Map<string, number>,
  dailyGoal: number,
  today: string,
): Streaks {
  const goal = Math.max(dailyGoal, 1)
  const successful = [...completedByDay.entries()]
    .filter(([, count]) => count >= goal)
    .map(([day]) => day)
    .sort()

  if (successful.length === 0) return { current: 0, best: 0 }

  let best = 1
  let run = 1
  for (let index = 1; index < successful.length; index += 1) {
    const previous = successful[index - 1]
    const day = successful[index]
    if (previous && day && addIsoDays(previous, 1) === day) run += 1
    else run = 1
    best = Math.max(best, run)
  }

  const reached = new Set(successful)
  let cursor = reached.has(today) ? today : addIsoDays(today, -1)
  let current = 0
  while (reached.has(cursor)) {
    current += 1
    cursor = addIsoDays(cursor, -1)
  }

  return { current, best: Math.max(best, current) }
}
