/**
 * @vitest-environment jsdom
 */
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeResponse } from '../../services/authApi'
import { authApi } from '../../services/authApi'
import { categoriesApi, tasksApi } from '../../services/tasksApi'
import type { Task, UserSettings } from '../../types/database'
import { useAuthStore } from '../authStore'
import { useDataStore } from '../dataStore'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 'task',
    userId: 'user-1',
    title: 'Task',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-10-02',
    dueTime: null,
    estimatedMinutes: null,
    categoryId: null,
    sortOrder: 0,
    completedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  }
}

function settings(theme: UserSettings['theme']): UserSettings {
  const now = '2026-10-01T00:00:00.000Z'
  return {
    user_id: 'user-1',
    theme,
    language: 'en',
    week_starts_on: 1,
    daily_goal: 5,
    sound_enabled: true,
    onboarding_completed: true,
    created_at: now,
    updated_at: now,
  }
}

function me(theme: UserSettings['theme']): MeResponse {
  return {
    id: 'user-1',
    email: 'a@b.c',
    displayName: 'A',
    profile: {
      id: 'user-1',
      display_name: 'A',
      avatar_url: null,
      created_at: '2026-10-01T00:00:00.000Z',
      updated_at: '2026-10-01T00:00:00.000Z',
    },
    settings: settings(theme),
  }
}

describe('task update races', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useDataStore.getState().reset()
  })

  it('keeps the last status when earlier requests are slower', async () => {
    const first = deferred<Task>()
    const second = deferred<Task>()
    vi.spyOn(tasksApi, 'update')
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)

    useDataStore.setState({
      tasks: [task({ id: 'a', status: 'todo' })],
      bootstrapped: true,
    })

    const started = useDataStore.getState().updateTask('a', { status: 'in_progress' })
    const finished = useDataStore.getState().updateTask('a', { status: 'done' })
    await Promise.resolve()
    expect(tasksApi.update).toHaveBeenCalledTimes(1)

    first.resolve(task({ id: 'a', status: 'in_progress' }))
    await started
    await Promise.resolve()
    expect(tasksApi.update).toHaveBeenCalledTimes(2)

    second.resolve(task({ id: 'a', status: 'done' }))
    await finished
    expect(useDataStore.getState().tasks.find((item) => item.id === 'a')?.status).toBe('done')
  })

  it('rolls back only the task whose request failed', async () => {
    vi.spyOn(tasksApi, 'update').mockImplementation((id, patch) => {
      if (id === 'a') return Promise.reject(new Error('nope'))
      return Promise.resolve(task({ id, status: patch.status ?? 'todo' }))
    })

    useDataStore.setState({
      tasks: [task({ id: 'a' }), task({ id: 'b' })],
      bootstrapped: true,
    })

    await useDataStore.getState().updateTask('b', { status: 'done' })
    await useDataStore.getState().updateTask('a', { status: 'in_progress' })

    const tasks = useDataStore.getState().tasks
    expect(tasks.find((item) => item.id === 'b')?.status).toBe('done')
    expect(tasks.find((item) => item.id === 'a')?.status).toBe('todo')
  })

  it('sends integer sort positions that fit a 32-bit int', async () => {
    const reorder = vi.spyOn(tasksApi, 'reorder').mockResolvedValue([
      task({ id: 'a', sortOrder: 0 }),
      task({ id: 'b', sortOrder: 1 }),
    ])
    useDataStore.setState({
      tasks: [task({ id: 'a', sortOrder: 4 }), task({ id: 'b', sortOrder: 9 })],
      bootstrapped: true,
    })

    await useDataStore.getState().reorderTasks(['b', 'a'])
    const items = reorder.mock.calls[0]?.[0] ?? []
    expect(items.map((item) => item.sortOrder)).toEqual([0, 1])
    expect(items.every((item) => item.sortOrder <= 2_147_483_647)).toBe(true)
  })
})

describe('settings and session races', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    localStorage.clear()
    await useAuthStore.getState().signOut()
  })

  it('ignores a late theme response', async () => {
    const light = deferred<MeResponse>()
    const colorblind = deferred<MeResponse>()
    vi.spyOn(authApi, 'updateSettings')
      .mockImplementationOnce(() => light.promise)
      .mockImplementationOnce(() => colorblind.promise)

    useAuthStore.setState({
      token: 'token',
      user: { id: 'user-1', email: 'a@b.c', displayName: 'A' },
      profile: me('dark').profile,
      settings: settings('dark'),
    })

    const first = useAuthStore.getState().updateSettings({ theme: 'light' })
    const second = useAuthStore.getState().updateSettings({ theme: 'colorblind' })
    expect(useAuthStore.getState().settings?.theme).toBe('colorblind')

    light.resolve(me('light'))
    await first
    expect(useAuthStore.getState().settings?.theme).toBe('colorblind')

    colorblind.resolve(me('colorblind'))
    await second
    expect(useAuthStore.getState().settings?.theme).toBe('colorblind')
    expect(document.documentElement.dataset.theme).toBe('colorblind')
  })

  it('rolls a failed theme change back to the last confirmed theme', async () => {
    const light = deferred<MeResponse>()
    vi.spyOn(authApi, 'updateSettings')
      .mockImplementationOnce(() => light.promise)
      .mockImplementationOnce(() => Promise.reject(new Error('save failed')))

    useAuthStore.setState({
      token: 'token',
      user: { id: 'user-1', email: 'a@b.c', displayName: 'A' },
      profile: me('dark').profile,
      settings: settings('dark'),
    })

    const first = useAuthStore.getState().updateSettings({ theme: 'light' })
    const second = useAuthStore.getState().updateSettings({ theme: 'colorblind' })
    light.resolve(me('light'))
    await first
    await second
    expect(useAuthStore.getState().settings?.theme).toBe('light')
  })

  it('keeps the token when /auth/me cannot be reached', async () => {
    localStorage.setItem('po-delu.accessToken', 'still-valid')
    vi.spyOn(authApi, 'me').mockRejectedValue(new axios.AxiosError('Network Error'))

    await useAuthStore.getState().initialize()

    expect(useAuthStore.getState().token).toBe('still-valid')
    expect(useAuthStore.getState().offline).toBe(true)
    expect(localStorage.getItem('po-delu.accessToken')).toBe('still-valid')
  })

  it('clears the session on a confirmed 401', async () => {
    localStorage.setItem('po-delu.accessToken', 'expired')
    const error = new axios.AxiosError('Unauthorized')
    error.status = 401
    error.response = {
      status: 401,
      data: {},
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    }
    vi.spyOn(authApi, 'me').mockRejectedValue(error)

    await useAuthStore.getState().initialize()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(localStorage.getItem('po-delu.accessToken')).toBeNull()
  })
})

describe('stale task lists', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useDataStore.getState().reset()
  })

  function hangList() {
    const listed = deferred<Task[]>()
    vi.spyOn(tasksApi, 'list').mockImplementation(() => listed.promise)
    vi.spyOn(tasksApi, 'listSubtasks').mockResolvedValue([])
    vi.spyOn(categoriesApi, 'list').mockResolvedValue([])
    return listed
  }

  it('does not let a delayed task list overwrite a newer status', async () => {
    const listed = hangList()
    vi.spyOn(tasksApi, 'update').mockResolvedValue(task({ id: 'a', status: 'in_progress' }))
    useDataStore.setState({
      tasks: [task({ id: 'a', status: 'todo' })],
      bootstrapped: true,
    })

    const loading = useDataStore.getState().load('user-1', { silent: true })
    await Promise.resolve()
    await useDataStore.getState().updateTask('a', { status: 'in_progress' })
    listed.resolve([task({ id: 'a', status: 'todo' })])
    await loading

    expect(useDataStore.getState().tasks.find((item) => item.id === 'a')?.status).toBe('in_progress')
    expect(useDataStore.getState().loading).toBe(false)

    vi.mocked(tasksApi.list).mockResolvedValue([
      task({ id: 'a', status: 'in_progress', title: 'From server' }),
    ])
    await useDataStore.getState().load('user-1', { silent: true })
    const saved = useDataStore.getState().tasks.find((item) => item.id === 'a')
    expect(saved?.status).toBe('in_progress')
    expect(saved?.title).toBe('From server')
  })

  it('does not let a delayed filtered list restore an older status', async () => {
    const listed = deferred<Task[]>()
    let reads = 0
    vi.spyOn(tasksApi, 'list').mockImplementation(() => {
      reads += 1
      if (reads === 1) return listed.promise
      return Promise.resolve([])
    })
    vi.spyOn(tasksApi, 'update').mockResolvedValue(task({ id: 'a', status: 'in_progress' }))
    useDataStore.setState({
      tasks: [task({ id: 'a', status: 'todo' })],
      bootstrapped: true,
    })

    const pending = useDataStore.getState().setStatusFilter('todo')
    await Promise.resolve()
    await useDataStore.getState().updateTask('a', { status: 'in_progress' })
    listed.resolve([task({ id: 'a', status: 'todo' })])
    await pending

    expect(tasksApi.list).toHaveBeenCalledWith('todo')
    expect(useDataStore.getState().tasks.find((item) => item.id === 'a')?.status).toBe('in_progress')
    await vi.waitFor(() => {
      expect(useDataStore.getState().filteredTasks.some((item) => item.status === 'todo')).toBe(false)
      expect(useDataStore.getState().listLoading).toBe(false)
    })
  })

  it('keeps a create, delete, restore and reorder ahead of a late list', async () => {
    const listed = hangList()
    vi.spyOn(tasksApi, 'create').mockResolvedValue(task({ id: 'created', title: 'Created' }))
    vi.spyOn(tasksApi, 'remove').mockResolvedValue(undefined)
    vi.spyOn(tasksApi, 'restore').mockResolvedValue({ task: task({ id: 'gone' }), subtasks: [] })
    vi.spyOn(tasksApi, 'reorder').mockResolvedValue([
      task({ id: 'b', sortOrder: 0 }),
      task({ id: 'a', sortOrder: 1 }),
    ])
    useDataStore.setState({
      tasks: [task({ id: 'gone' }), task({ id: 'a', sortOrder: 0 }), task({ id: 'b', sortOrder: 1 })],
      bootstrapped: true,
    })

    const loading = useDataStore.getState().load('user-1', { silent: true })
    await Promise.resolve()
    await useDataStore.getState().createTask('user-1', { title: 'Created', dueDate: '2026-10-02' })
    await useDataStore.getState().deleteTask('gone')
    await useDataStore.getState().restoreTask(task({ id: 'gone' }), [])
    await useDataStore.getState().reorderTasks(['b', 'a'])
    listed.resolve([
      task({ id: 'gone', sortOrder: 0 }),
      task({ id: 'a', sortOrder: 0 }),
      task({ id: 'b', sortOrder: 1 }),
    ])
    await loading

    const tasks = useDataStore.getState().tasks
    expect(tasks.map((item) => item.id).sort()).toEqual(['a', 'b', 'created', 'gone'])
    const order = tasks
      .filter((item) => item.id === 'a' || item.id === 'b')
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => item.id)
    expect(order).toEqual(['b', 'a'])
  })

  it('drops a list that belongs to a signed-out session', async () => {
    const listed = hangList()
    useDataStore.setState({
      tasks: [task({ id: 'a' })],
      bootstrapped: true,
    })
    const loading = useDataStore.getState().load('user-1', { silent: true })
    useDataStore.getState().reset()
    listed.resolve([task({ id: 'foreign' })])
    await loading
    expect(useDataStore.getState().tasks).toEqual([])
  })
})

describe('filter changes during a mutation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useDataStore.getState().reset()
  })

  function ids() {
    return useDataStore
      .getState()
      .filteredTasks.map((item) => item.id)
      .sort()
  }

  it('keeps only todo tasks when the filter changes while a task is being created', async () => {
    const existing = task({ id: 'todo', status: 'todo', title: 'Existing' })
    const finished = task({ id: 'done', status: 'done', title: 'Finished' })
    const created = task({ id: 'created', status: 'todo', title: 'New' })
    useDataStore.setState({
      tasks: [existing, finished],
      filteredTasks: [finished],
      statusFilter: 'done',
      bootstrapped: true,
    })

    const creating = deferred<Task>()
    const firstList = deferred<Task[]>()
    let todoReads = 0
    vi.spyOn(tasksApi, 'create').mockImplementation(() => creating.promise)
    vi.spyOn(tasksApi, 'list').mockImplementation((status) => {
      if (status !== 'todo') return Promise.resolve([finished])
      todoReads += 1
      if (todoReads === 1) return firstList.promise
      return Promise.resolve([existing, created])
    })

    const pendingCreate = useDataStore.getState().createTask('user-1', {
      title: 'New',
      dueDate: '2026-10-04',
    })
    await Promise.resolve()
    const pendingFilter = useDataStore.getState().setStatusFilter('todo')
    await Promise.resolve()
    firstList.resolve([existing])
    await pendingFilter

    expect(useDataStore.getState().statusFilter).toBe('todo')
    expect(tasksApi.list).toHaveBeenCalledWith('todo')
    expect(useDataStore.getState().filteredTasks.every((item) => item.status === 'todo')).toBe(true)
    expect(ids()).toContain('todo')
    expect(ids()).not.toContain('done')
    expect(useDataStore.getState().filteredTasks.some((item) => item.title === 'New')).toBe(true)

    creating.resolve(created)
    await pendingCreate
    await vi.waitFor(() => expect(ids()).toEqual(['created', 'todo']))
  })

  it('includes a task whose status changed while the filter request was in flight', async () => {
    const moving = task({ id: 'a', status: 'done' })
    const staying = task({ id: 'b', status: 'todo' })
    useDataStore.setState({
      tasks: [moving, staying],
      filteredTasks: [moving],
      statusFilter: 'done',
      bootstrapped: true,
    })

    const updated = deferred<Task>()
    const firstList = deferred<Task[]>()
    let reads = 0
    vi.spyOn(tasksApi, 'update').mockImplementation(() => updated.promise)
    vi.spyOn(tasksApi, 'list').mockImplementation((status) => {
      if (status !== 'todo') return Promise.resolve([moving])
      reads += 1
      if (reads === 1) return firstList.promise
      return Promise.resolve([
        task({ id: 'a', status: 'todo' }),
        staying,
      ])
    })

    const pendingUpdate = useDataStore.getState().updateTask('a', { status: 'todo' })
    await Promise.resolve()
    await Promise.resolve()
    const pendingFilter = useDataStore.getState().setStatusFilter('todo')
    await Promise.resolve()
    firstList.resolve([staying])
    await pendingFilter

    expect(ids()).toEqual(['a', 'b'])
    expect(useDataStore.getState().filteredTasks.every((item) => item.status === 'todo')).toBe(true)

    updated.resolve(task({ id: 'a', status: 'todo' }))
    await pendingUpdate
    await vi.waitFor(() => expect(ids()).toEqual(['a', 'b']))
  })

  it('omits a deleted task after the filter changes during deletion', async () => {
    const removed = task({ id: 'a', status: 'done' })
    const staying = task({ id: 'b', status: 'todo' })
    useDataStore.setState({
      tasks: [removed, staying],
      filteredTasks: [removed],
      statusFilter: 'done',
      bootstrapped: true,
    })

    const deleting = deferred<void>()
    const firstList = deferred<Task[]>()
    let reads = 0
    vi.spyOn(tasksApi, 'remove').mockImplementation(() => deleting.promise.then(() => undefined))
    vi.spyOn(tasksApi, 'list').mockImplementation((status) => {
      if (status !== 'todo') return Promise.resolve([removed])
      reads += 1
      if (reads === 1) return firstList.promise
      return Promise.resolve([staying])
    })

    const pendingDelete = useDataStore.getState().deleteTask('a')
    await Promise.resolve()
    const pendingFilter = useDataStore.getState().setStatusFilter('todo')
    await Promise.resolve()
    firstList.resolve([removed, staying])
    await pendingFilter

    expect(ids()).toEqual(['b'])

    deleting.resolve()
    await pendingDelete
    await vi.waitFor(() => expect(ids()).toEqual(['b']))
  })
})
