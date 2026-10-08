import type { Category, Subtask, Task } from '../types/database'
import type { TaskFilter } from '../types/filters'
import { addIsoDays, endOfIsoWeek, timestampToIsoDay } from './isoDate'

export type UpcomingBucket = 'tomorrow' | 'week' | 'later'
export type CompletedBucket = 'today' | 'yesterday' | 'older'

export function isDone(task: Task): boolean {
  return task.status === 'done'
}

export interface TodayProgress {
  done: number
  total: number
  percent: number
}

/** Done and total both come from tasks due on the local day. Empty day is 0/0. */
export function todayProgress(tasks: Task[], today: string): TodayProgress {
  const dueToday = tasks.filter((task) => task.dueDate === today)
  const total = dueToday.length
  const done = dueToday.filter((task) => isDone(task)).length
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
}

/** Active tasks first, then manual order, with creation time as a stable tiebreaker. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (isDone(a) !== isDone(b)) return isDone(a) ? 1 : -1
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter((task) => {
    if (filter.priorities.length && !filter.priorities.includes(task.priority)) return false
    if (filter.statuses.length && !filter.statuses.includes(task.status)) return false
    if (filter.categoryIds.length) {
      if (!task.categoryId || !filter.categoryIds.includes(task.categoryId)) return false
    }
    if (filter.completion === 'active' && isDone(task)) return false
    if (filter.completion === 'completed' && !isDone(task)) return false
    return true
  })
}

/** Matches title, description and category name. */
export function searchTasks(tasks: Task[], query: string, categories: Category[] = []): Task[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return tasks
  const names = new Map(categories.map((category) => [category.id, category.name.toLowerCase()]))
  return tasks.filter((task) => {
    const haystack = [
      task.title,
      task.description,
      task.categoryId ? names.get(task.categoryId) ?? '' : '',
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(needle)
  })
}

/** Inbox lists tasks that are still to do. Status stays one of the three spec values. */
export function isInboxTask(task: Task): boolean {
  return task.status === 'todo'
}

export function isTodayTask(task: Task, today: string): boolean {
  return task.dueDate === today
}

/** Unfinished tasks scheduled before today. */
export function isOverdue(task: Task, today: string): boolean {
  return !isDone(task) && task.dueDate < today
}

/** Weeks start on Monday everywhere in the product. */
export function upcomingBucket(taskDate: string, today: string): UpcomingBucket {
  if (taskDate === addIsoDays(today, 1)) return 'tomorrow'
  if (taskDate <= endOfIsoWeek(today, 1)) return 'week'
  return 'later'
}

export function groupUpcoming(tasks: Task[], today: string): Record<UpcomingBucket, Task[]> {
  const groups: Record<UpcomingBucket, Task[]> = { tomorrow: [], week: [], later: [] }
  for (const task of tasks) {
    if (task.dueDate <= today) continue
    groups[upcomingBucket(task.dueDate, today)].push(task)
  }
  const byDate = (a: Task, b: Task) => a.dueDate.localeCompare(b.dueDate) || a.sortOrder - b.sortOrder
  groups.tomorrow.sort(byDate)
  groups.week.sort(byDate)
  groups.later.sort(byDate)
  return groups
}

/** Local calendar day of completedAt. Null when the task is not done or the stamp is unknown. */
export function completionDay(task: Task): string | null {
  if (!isDone(task)) return null
  return timestampToIsoDay(task.completedAt)
}

export function completedBucket(task: Task, today: string): CompletedBucket {
  const day = completionDay(task)
  if (!day) return 'older'
  if (day === today) return 'today'
  if (day === addIsoDays(today, -1)) return 'yesterday'
  return 'older'
}

export function groupCompleted(tasks: Task[], today: string): Record<CompletedBucket, Task[]> {
  const groups: Record<CompletedBucket, Task[]> = { today: [], yesterday: [], older: [] }
  for (const task of tasks) groups[completedBucket(task, today)].push(task)
  const recentFirst = (a: Task, b: Task) =>
    (completionDay(b) ?? '').localeCompare(completionDay(a) ?? '')
  groups.today.sort(recentFirst)
  groups.yesterday.sort(recentFirst)
  groups.older.sort(recentFirst)
  return groups
}

/** Completed task count per local calendar day. Unknown completion times are omitted. */
export function completedByDay(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const task of tasks) {
    const day = completionDay(task)
    if (!day) continue
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  return counts
}

export function moveInList<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return items
  next.splice(to, 0, moved)
  return next
}

export function subtaskProgress(subtasks: Subtask[]): { done: number; total: number } {
  return {
    done: subtasks.filter((subtask) => subtask.completed).length,
    total: subtasks.length,
  }
}

/** Places a new task at the end of the current list. */
export function nextSortOrder(tasks: Task[]): number {
  return tasks.reduce((max, task) => Math.max(max, task.sortOrder), 0) + 1
}

/** PostgreSQL INT4. Positions stay far below this. */
export const SORT_ORDER_MAX = 2_147_483_647

/**
 * Reorders `visibleOrderedIds` as one block and keeps every other task in place.
 * Positions are small integers so they fit `Task.sortOrder`.
 */
export function assignSortOrders(
  all: Task[],
  visibleOrderedIds: string[],
): { id: string; sortOrder: number }[] {
  const visible = new Set(visibleOrderedIds)
  const byId = new Map(all.map((task) => [task.id, task]))
  const sorted = [...all].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
  )
  const ordered: Task[] = []
  let placed = false
  for (const task of sorted) {
    if (!visible.has(task.id)) {
      ordered.push(task)
      continue
    }
    if (!placed) {
      for (const id of visibleOrderedIds) {
        const item = byId.get(id)
        if (item) ordered.push(item)
      }
      placed = true
    }
  }
  return ordered.map((task, index) => ({
    id: task.id,
    sortOrder: Math.min(index, SORT_ORDER_MAX),
  }))
}
