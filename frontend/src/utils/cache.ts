import type { Category, Subtask, Task } from '../types/database'

const PREFIX = 'po-delu.cache.v2.'

interface CachePayload {
  tasks: Task[]
  categories: Category[]
  subtasks: Subtask[]
  savedAt: number
}

type CacheInput = Pick<CachePayload, 'tasks' | 'categories' | 'subtasks'>

/** Best-effort local snapshot so a cold start works offline. */
export function writeCache(userId: string, input: CacheInput): void {
  try {
    const payload: CachePayload = {
      tasks: input.tasks,
      categories: input.categories,
      subtasks: input.subtasks,
      savedAt: Date.now(),
    }
    localStorage.setItem(PREFIX + userId, JSON.stringify(payload))
  } catch {
    // Storage can be full or blocked in private mode; the app works without it.
  }
}

export function readCache(userId: string): CachePayload | null {
  try {
    const raw = localStorage.getItem(PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CachePayload>
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.categories) || !Array.isArray(parsed.subtasks)) {
      return null
    }
    const tasksFitContract = parsed.tasks.every(
      (task) =>
        task &&
        typeof task === 'object' &&
        'dueDate' in task &&
        'userId' in task &&
        'status' in task &&
        !('completed' in task),
    )
    if (!tasksFitContract) return null
    return {
      tasks: parsed.tasks,
      categories: parsed.categories,
      subtasks: parsed.subtasks,
      savedAt: parsed.savedAt ?? 0,
    }
  } catch {
    return null
  }
}

export function clearCache(userId: string): void {
  try {
    localStorage.removeItem(PREFIX + userId)
  } catch {
    // Nothing to recover from.
  }
}
