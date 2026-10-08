import { describe, expect, it } from 'vitest'
import type { Task } from '../../types/database'
import { EMPTY_FILTER } from '../../types/filters'
import { fromIsoDay } from '../isoDate'
import {
  completedByDay,
  completedBucket,
  filterTasks,
  groupCompleted,
  groupUpcoming,
  isInboxTask,
  isOverdue,
  moveInList,
  assignSortOrders,
  nextSortOrder,
  searchTasks,
  sortTasks,
  subtaskProgress,
  todayProgress,
  upcomingBucket,
} from '../tasks'

const TODAY = '2026-09-03' // Thursday

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

describe('sortTasks', () => {
  it('keeps active tasks above completed ones', () => {
    const result = sortTasks([
      task({ id: 'done', status: 'done', sortOrder: 1 }),
      task({ id: 'active', sortOrder: 5 }),
    ])
    expect(result.map((item) => item.id)).toEqual(['active', 'done'])
  })

  it('orders by sort_order and falls back to creation time', () => {
    const result = sortTasks([
      task({ id: 'c', sortOrder: 2 }),
      task({ id: 'a', sortOrder: 1, createdAt: '2026-09-01T09:00:00.000Z' }),
      task({ id: 'b', sortOrder: 1, createdAt: '2026-09-01T11:00:00.000Z' }),
    ])
    expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the input array', () => {
    const input = [task({ id: 'x', sortOrder: 2 }), task({ id: 'y', sortOrder: 1 })]
    sortTasks(input)
    expect(input.map((item) => item.id)).toEqual(['x', 'y'])
  })
})

describe('filterTasks', () => {
  const tasks = [
    task({ id: 'low', priority: 'low', categoryId: 'work' }),
    task({ id: 'high', priority: 'high', status: 'in_progress' }),
    task({ id: 'done', status: 'done' }),
  ]

  it('returns everything for an empty filter', () => {
    expect(filterTasks(tasks, EMPTY_FILTER)).toHaveLength(3)
  })

  it('filters by priority', () => {
    const result = filterTasks(tasks, { ...EMPTY_FILTER, priorities: ['high'] })
    expect(result.map((item) => item.id)).toEqual(['high'])
  })

  it('filters by status', () => {
    const result = filterTasks(tasks, { ...EMPTY_FILTER, statuses: ['in_progress'] })
    expect(result.map((item) => item.id)).toEqual(['high'])
  })

  it('excludes uncategorised tasks when categories are selected', () => {
    const result = filterTasks(tasks, { ...EMPTY_FILTER, categoryIds: ['work'] })
    expect(result.map((item) => item.id)).toEqual(['low'])
  })

  it('splits active and completed', () => {
    expect(filterTasks(tasks, { ...EMPTY_FILTER, completion: 'active' })).toHaveLength(2)
    expect(filterTasks(tasks, { ...EMPTY_FILTER, completion: 'completed' })).toHaveLength(1)
  })
})

describe('searchTasks', () => {
  const categories = [{ id: 'cat-1', user_id: 'user-1', name: 'Health', icon: 'heart', created_at: '' }]
  const tasks = [
    task({ id: 'title', title: 'Buy groceries' }),
    task({ id: 'description', title: 'Call', description: 'Ask about the invoice' }),
    task({ id: 'category', title: 'Run', categoryId: 'cat-1' }),
  ]

  it('returns all tasks for a blank query', () => {
    expect(searchTasks(tasks, '   ', categories)).toHaveLength(3)
  })

  it('matches the title case-insensitively', () => {
    expect(searchTasks(tasks, 'GROCERIES', categories).map((item) => item.id)).toEqual(['title'])
  })

  it('matches the description', () => {
    expect(searchTasks(tasks, 'invoice', categories).map((item) => item.id)).toEqual(['description'])
  })

  it('matches the category name', () => {
    expect(searchTasks(tasks, 'health', categories).map((item) => item.id)).toEqual(['category'])
  })
})

describe('upcoming grouping', () => {
  it('buckets tomorrow, the rest of the week and later', () => {
    expect(upcomingBucket('2026-09-04', TODAY)).toBe('tomorrow')
    expect(upcomingBucket('2026-09-06', TODAY)).toBe('week')
    expect(upcomingBucket('2026-09-07', TODAY)).toBe('later')
  })

  it('always starts the week on Monday', () => {
    expect(upcomingBucket('2026-09-06', TODAY)).toBe('week')
    expect(upcomingBucket('2026-09-07', TODAY)).toBe('later')
  })

  it('ignores today and past tasks', () => {
    const groups = groupUpcoming(
      [
        task({ id: 'today', dueDate: TODAY }),
        task({ id: 'past', dueDate: '2026-08-30' }),
        task({ id: 'tomorrow', dueDate: '2026-09-04' }),
      ],
      TODAY,
    )
    expect(groups.tomorrow.map((item) => item.id)).toEqual(['tomorrow'])
    expect(groups.week).toHaveLength(0)
    expect(groups.later).toHaveLength(0)
  })

  it('sorts each bucket by date', () => {
    const groups = groupUpcoming(
      [task({ id: 'late', dueDate: '2026-10-01' }), task({ id: 'soon', dueDate: '2026-09-20' })],
      TODAY,
    )
    expect(groups.later.map((item) => item.id)).toEqual(['soon', 'late'])
  })
})

describe('completed grouping', () => {
  it('buckets finished tasks by the local completion day', () => {
    expect(
      completedBucket(task({ status: 'done', dueDate: '2026-01-01', completedAt: completedAtOn(TODAY) }), TODAY),
    ).toBe('today')
    expect(
      completedBucket(
        task({ status: 'done', dueDate: TODAY, completedAt: completedAtOn('2026-09-02') }),
        TODAY,
      ),
    ).toBe('yesterday')
  })

  it('keeps an unknown completion time out of today and yesterday', () => {
    expect(completedBucket(task({ status: 'done', dueDate: TODAY, completedAt: null }), TODAY)).toBe('older')
  })

  it('groups into today, yesterday and older', () => {
    const groups = groupCompleted(
      [
        task({ id: 'a', status: 'done', completedAt: completedAtOn(TODAY) }),
        task({ id: 'b', status: 'done', completedAt: completedAtOn('2026-09-02') }),
        task({ id: 'c', status: 'done', completedAt: completedAtOn('2026-08-11') }),
        task({ id: 'd', status: 'done', dueDate: TODAY, completedAt: null }),
      ],
      TODAY,
    )
    expect(groups.today.map((item) => item.id)).toEqual(['a'])
    expect(groups.yesterday.map((item) => item.id)).toEqual(['b'])
    expect(groups.older.map((item) => item.id)).toEqual(['c', 'd'])
  })
})

describe('completedByDay', () => {
  it('counts done tasks by completion day and skips an unknown stamp', () => {
    const counts = completedByDay([
      task({ status: 'done', dueDate: '2026-01-01', completedAt: completedAtOn(TODAY) }),
      task({ status: 'done', dueDate: '2026-01-02', completedAt: completedAtOn(TODAY) }),
      task({ status: 'todo', dueDate: TODAY, completedAt: completedAtOn(TODAY) }),
      task({ status: 'done', dueDate: TODAY, completedAt: null }),
    ])
    expect(counts.get(TODAY)).toBe(2)
    expect(counts.size).toBe(1)
  })
})

describe('todayProgress', () => {
  it('counts only tasks due today', () => {
    const summary = todayProgress(
      [
        task({ dueDate: TODAY, status: 'done' }),
        task({ dueDate: TODAY, status: 'todo' }),
        task({ dueDate: TODAY, status: 'in_progress' }),
        task({ dueDate: '2026-09-02', status: 'done' }),
        task({ dueDate: '2026-09-04', status: 'done' }),
      ],
      TODAY,
    )
    expect(summary).toEqual({ done: 1, total: 3, percent: 33 })
  })

  it('reports an empty day as zero', () => {
    expect(todayProgress([], TODAY)).toEqual({ done: 0, total: 0, percent: 0 })
    expect(todayProgress([task({ dueDate: '2026-09-04', status: 'done' })], TODAY)).toEqual({
      done: 0,
      total: 0,
      percent: 0,
    })
  })
})

describe('task predicates', () => {
  it('treats to-do tasks as inbox without a fourth status', () => {
    expect(isInboxTask(task({ status: 'todo' }))).toBe(true)
    expect(isInboxTask(task({ status: 'in_progress' }))).toBe(false)
    expect(isInboxTask(task({ status: 'done' }))).toBe(false)
  })

  it('marks unfinished past tasks as overdue', () => {
    expect(isOverdue(task({ dueDate: '2026-09-02' }), TODAY)).toBe(true)
    expect(isOverdue(task({ dueDate: '2026-09-02', status: 'done' }), TODAY)).toBe(false)
    expect(isOverdue(task({ dueDate: TODAY }), TODAY)).toBe(false)
  })
})

describe('reordering helpers', () => {
  it('moves an item between positions', () => {
    expect(moveInList(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveInList(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('returns the original list for no-ops and invalid indexes', () => {
    const list = ['a', 'b']
    expect(moveInList(list, 1, 1)).toBe(list)
    expect(moveInList(list, -1, 0)).toBe(list)
    expect(moveInList(list, 0, 9)).toBe(list)
  })

  it('appends new tasks after the current maximum', () => {
    expect(nextSortOrder([task({ sortOrder: 3 }), task({ sortOrder: 9 })])).toBe(10)
    expect(nextSortOrder([])).toBe(1)
  })

  it('assigns small integer positions and keeps tasks outside the visible list', () => {
    const positions = assignSortOrders(
      [
        task({ id: 'hidden', sortOrder: 0, createdAt: '2026-09-01T00:00:00.000Z' }),
        task({ id: 'a', sortOrder: 1, createdAt: '2026-09-02T00:00:00.000Z' }),
        task({ id: 'b', sortOrder: 2, createdAt: '2026-09-03T00:00:00.000Z' }),
      ],
      ['b', 'a'],
    )
    expect(positions.map((item) => item.sortOrder).every((order) => order >= 0 && order < 10)).toBe(true)
    expect(positions.map((item) => item.id)).toEqual(['hidden', 'b', 'a'])
  })
})

describe('subtaskProgress', () => {
  it('counts completed subtasks', () => {
    const base = { task_id: 't', user_id: 'u', sort_order: 0, created_at: '' }
    expect(
      subtaskProgress([
        { ...base, id: '1', title: 'a', completed: true },
        { ...base, id: '2', title: 'b', completed: false },
      ]),
    ).toEqual({ done: 1, total: 2 })
  })
})
