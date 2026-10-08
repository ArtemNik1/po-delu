import type { Priority, Status } from './database'

export type CompletionFilter = 'all' | 'active' | 'completed'

export interface TaskFilter {
  priorities: Priority[]
  categoryIds: string[]
  statuses: Status[]
  completion: CompletionFilter
}

export const EMPTY_FILTER: TaskFilter = {
  priorities: [],
  categoryIds: [],
  statuses: [],
  completion: 'all',
}

export function countActiveFilters(filter: TaskFilter): number {
  return (
    filter.priorities.length +
    filter.categoryIds.length +
    filter.statuses.length +
    (filter.completion === 'all' ? 0 : 1)
  )
}
