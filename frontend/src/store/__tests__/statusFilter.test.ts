import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Status, Task } from '../../types/database'

const list = vi.fn()

vi.mock('../../services/tasksApi', () => ({
  tasksApi: {
    list: (...args: unknown[]) => list(...args),
    listSubtasks: vi.fn(async () => []),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
    addSubtask: vi.fn(),
    updateSubtask: vi.fn(),
    removeSubtask: vi.fn(),
  },
  categoriesApi: {
    list: vi.fn(async () => []),
    create: vi.fn(),
    remove: vi.fn(),
  },
}))

import { useDataStore } from '../dataStore'

function task(status: Status): Task {
  return {
    id: status,
    title: status,
    description: '',
    status,
    priority: 'medium',
    dueDate: '2026-09-30',
    userId: 'user-1',
    dueTime: null,
    estimatedMinutes: null,
    categoryId: null,
    sortOrder: 1,
    completedAt: null,
    createdAt: '2026-09-30T00:00:00.000Z',
    updatedAt: '2026-09-30T00:00:00.000Z',
  }
}

beforeEach(() => {
  list.mockReset()
  useDataStore.getState().reset()
})

describe('setStatusFilter', () => {
  it('asks the API for the selected status', async () => {
    list.mockResolvedValue([task('todo')])
    await useDataStore.getState().setStatusFilter('todo')
    expect(list).toHaveBeenCalledWith('todo')
    expect(useDataStore.getState().filteredTasks.map((item) => item.id)).toEqual(['todo'])
  })

  it('drops a late response from an older filter', async () => {
    let releaseTodo: (value: Task[]) => void = () => {}
    list.mockImplementation((status?: Status) => {
      if (status === 'todo') {
        return new Promise<Task[]>((resolve) => {
          releaseTodo = resolve
        })
      }
      return Promise.resolve([task('done')])
    })

    const first = useDataStore.getState().setStatusFilter('todo')
    const second = useDataStore.getState().setStatusFilter('done')
    await second
    releaseTodo([task('todo')])
    await first

    expect(useDataStore.getState().statusFilter).toBe('done')
    expect(useDataStore.getState().filteredTasks.map((item) => item.status)).toEqual(['done'])
  })
})
