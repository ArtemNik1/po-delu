import { useMemo } from 'react'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { Subtask, Task } from '../types/database'
import { todayIso } from '../utils/isoDate'
import { filterTasks, searchTasks, sortTasks } from '../utils/tasks'

/**
 * Selectors must return referentially stable values: Zustand v5 re-renders on
 * every new reference, so derived arrays are memoised here instead.
 */
export function useSubtasksOf(taskId: string | null): Subtask[] {
  const subtasks = useDataStore((state) => state.subtasks)
  return useMemo(
    () => (taskId ? subtasks.filter((subtask) => subtask.task_id === taskId) : []),
    [subtasks, taskId],
  )
}

export function useCategory(categoryId: string | null) {
  const categories = useDataStore((state) => state.categories)
  return useMemo(
    () => (categoryId ? categories.find((category) => category.id === categoryId) ?? null : null),
    [categories, categoryId],
  )
}

export function useTask(taskId: string | null): Task | null {
  return useDataStore((state) => state.tasks.find((task) => task.id === taskId) ?? null)
}

export function useToday(): string {
  // Recomputed per render but stable within a session day.
  return todayIso()
}

/** Applies the active search query and filter popover selection, then sorts. */
export function useVisibleTasks(source: (tasks: Task[]) => Task[]): Task[] {
  const tasks = useDataStore((state) => state.tasks)
  const categories = useDataStore((state) => state.categories)
  const filters = useUiStore((state) => state.filters)
  const query = useUiStore((state) => state.searchQuery)

  return useMemo(
    () => sortTasks(filterTasks(searchTasks(source(tasks), query, categories), filters)),
    [tasks, categories, filters, query, source],
  )
}
