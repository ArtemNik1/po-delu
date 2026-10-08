import { create } from 'zustand'
import { translate } from '../lib/i18n'
import { getApiErrorMessage } from '../services/api'
import { categoriesApi, tasksApi } from '../services/tasksApi'
import type { Category, Status, Subtask, Task, TaskInsert, TaskPatch } from '../types/database'
import { readCache, writeCache } from '../utils/cache'
import { assignSortOrders, nextSortOrder } from '../utils/tasks'
import { clearTaskDrafts, subtaskDraftKey, useDraftStore } from './draftStore'
import { toast } from './toastStore'

export type StatusFilter = 'all' | Status

let catalogRequest = 0
let filterRequest = 0
let sessionEpoch = 0
let reorderEpoch = 0
let listEpoch = 0
let mutationDepth = 0
let refreshFilterWhenIdle = false

function refreshCurrentFilter(): void {
  const status = useDataStore.getState().statusFilter
  void useDataStore.getState().setStatusFilter(status)
}

function guardLists<T>(work: () => Promise<T>): Promise<T> {
  listEpoch += 1
  mutationDepth += 1
  const session = sessionEpoch
  return work().finally(() => {
    mutationDepth = Math.max(0, mutationDepth - 1)
    if (session !== sessionEpoch) {
      refreshFilterWhenIdle = false
      return
    }
    if (mutationDepth === 0 && refreshFilterWhenIdle) {
      refreshFilterWhenIdle = false
      refreshCurrentFilter()
    }
  })
}

function settleStaleFilter(): void {
  if (mutationDepth > 0) {
    refreshFilterWhenIdle = true
    return
  }
  refreshCurrentFilter()
}

/** A list read that overlapped a mutation still describes the previous server state. */
function listSnapshotIsFresh(epoch: number, startedDuringMutation: boolean): boolean {
  return !startedDuringMutation && epoch === listEpoch && mutationDepth === 0
}

const taskQueues = new Map<string, Promise<unknown>>()

function enqueue<T>(id: string, work: () => Promise<T>): Promise<T> {
  const previous = taskQueues.get(id) ?? Promise.resolve()
  const run = previous.then(work, work)
  taskQueues.set(
    id,
    run.then(
      () => undefined,
      () => undefined,
    ),
  )
  return run
}

interface DataState {
  tasks: Task[]
  filteredTasks: Task[]
  statusFilter: StatusFilter
  listLoading: boolean
  categories: Category[]
  subtasks: Subtask[]
  loading: boolean
  bootstrapped: boolean
  error: string | null
  load: (userId: string, options?: { silent?: boolean }) => Promise<void>
  setStatusFilter: (status: StatusFilter) => Promise<void>
  subscribe: (userId: string) => () => void
  reset: () => void
  createTask: (userId: string, input: TaskInsert, options?: { notify?: boolean }) => Promise<Task | null>
  updateTask: (id: string, patch: TaskPatch, options?: { toast?: 'saved' | 'none' }) => Promise<boolean>
  deleteTask: (id: string) => Promise<{ task: Task; subtasks: Subtask[] } | null>
  restoreTask: (task: Task, subtasks: Subtask[]) => Promise<void>
  duplicateTask: (userId: string, task: Task) => Promise<Task | null>
  reorderTasks: (orderedIds: string[]) => Promise<void>
  createCategory: (userId: string, name: string, icon: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  addSubtask: (userId: string, taskId: string, title: string) => Promise<void>
  updateSubtask: (
    id: string,
    patch: Partial<Pick<Subtask, 'title' | 'completed' | 'sort_order'>>,
  ) => Promise<boolean>
  deleteSubtask: (id: string) => Promise<void>
}

function matchesFilter(task: Task, filter: StatusFilter): boolean {
  return filter === 'all' || task.status === filter
}

function syncFiltered(current: Task[], filter: StatusFilter, updated?: Task): Task[] {
  if (filter === 'all') return current
  if (!updated) return current.filter((task) => task.status === filter)
  if (!matchesFilter(updated, filter)) return current.filter((task) => task.id !== updated.id)
  const exists = current.some((task) => task.id === updated.id)
  return exists ? current.map((task) => (task.id === updated.id ? updated : task)) : [...current, updated]
}

export const useDataStore = create<DataState>((set, get) => ({
  tasks: [],
  filteredTasks: [],
  statusFilter: 'all',
  listLoading: false,
  categories: [],
  subtasks: [],
  loading: false,
  bootstrapped: false,
  error: null,

  reset: () => {
    catalogRequest += 1
    filterRequest += 1
    sessionEpoch += 1
    reorderEpoch += 1
    listEpoch += 1
    mutationDepth = 0
    refreshFilterWhenIdle = false
    taskQueues.clear()
    set({
      tasks: [],
      filteredTasks: [],
      statusFilter: 'all',
      listLoading: false,
      categories: [],
      subtasks: [],
      loading: false,
      bootstrapped: false,
      error: null,
    })
  },

  load: async (userId, options) => {
    const cached = readCache(userId)
    if (cached && !get().bootstrapped) {
      set({
        tasks: cached.tasks,
        categories: cached.categories,
        subtasks: cached.subtasks,
        bootstrapped: true,
      })
    }
    if (!get().bootstrapped && !options?.silent) set({ loading: true })

    const request = ++catalogRequest
    const epoch = listEpoch
    const startedDuringMutation = mutationDepth > 0
    try {
      const [tasks, categories, subtasks] = await Promise.all([
        tasksApi.list(),
        categoriesApi.list(),
        tasksApi.listSubtasks(),
      ])
      if (request !== catalogRequest) return
      if (!listSnapshotIsFresh(epoch, startedDuringMutation)) {
        set({ loading: false, bootstrapped: true })
        return
      }
      const next = { tasks, categories, subtasks }
      set({ ...next, loading: false, bootstrapped: true, error: null })
      writeCache(userId, next)
      if (get().statusFilter !== 'all') await get().setStatusFilter(get().statusFilter)
    } catch (error) {
      if (request !== catalogRequest) return
      set({ loading: false, bootstrapped: true, error: getApiErrorMessage(error) })
      if (!navigator.onLine && cached) return
      toast({ kind: 'error', title: translate('error.loadTasks'), description: getApiErrorMessage(error) })
    }
  },

  setStatusFilter: async (status) => {
    const request = ++filterRequest
    const epoch = listEpoch
    const startedDuringMutation = mutationDepth > 0
    set({ statusFilter: status, listLoading: true })
    try {
      const listed = await tasksApi.list(status === 'all' ? undefined : status)
      if (request !== filterRequest || get().statusFilter !== status) return
      if (!listSnapshotIsFresh(epoch, startedDuringMutation)) {
        if (get().statusFilter === status && status !== 'all') {
          set({
            filteredTasks: get().tasks.filter((task) => task.status === status),
            listLoading: false,
          })
        } else {
          set({ listLoading: false })
        }
        if (get().statusFilter === status) settleStaleFilter()
        return
      }
      if (status === 'all') {
        set({ tasks: listed, filteredTasks: [], listLoading: false, error: null })
        const owner = listed[0]?.userId
        if (owner) writeCache(owner, get())
      } else {
        set({ filteredTasks: listed, listLoading: false, error: null })
      }
    } catch (error) {
      if (request !== filterRequest) return
      set({ listLoading: false, error: getApiErrorMessage(error) })
      toast({ kind: 'error', title: translate('error.loadTasks'), description: getApiErrorMessage(error) })
    }
  },

  subscribe: (userId) => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') void get().load(userId, { silent: true })
    }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  },

  createTask: async (userId, input, options) => {
    const title = input.title.trim()
    if (!title || !input.dueDate) return null

    return guardLists(() => createOptimistic())

    async function createOptimistic() {
    const now = new Date().toISOString()
    const optimistic: Task = {
      id: crypto.randomUUID(),
      userId,
      title,
      description: input.description?.trim() ?? '',
      priority: input.priority ?? 'medium',
      status: input.status ?? 'todo',
      dueDate: input.dueDate,
      dueTime: input.dueTime ?? null,
      estimatedMinutes: input.estimatedMinutes ?? null,
      categoryId: input.categoryId ?? null,
      sortOrder: input.sortOrder ?? nextSortOrder(get().tasks),
      completedAt: (input.status ?? 'todo') === 'done' ? now : null,
      createdAt: now,
      updatedAt: now,
    }

    const filter = get().statusFilter
    set((state) => ({
      tasks: [...state.tasks, optimistic],
      filteredTasks: matchesFilter(optimistic, filter)
        ? [...state.filteredTasks, optimistic]
        : state.filteredTasks,
    }))

    try {
      const created = await tasksApi.create({ ...input, title, status: optimistic.status })
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === optimistic.id ? created : task)),
        filteredTasks: syncFiltered(state.filteredTasks, state.statusFilter, created).filter(
          (task) => task.id !== optimistic.id,
        ),
      }))
      writeCache(userId, get())
      if (options?.notify !== false) {
        toast({ kind: 'success', title: translate('toast.taskCreated') })
      }
      return created
    } catch (error) {
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== optimistic.id),
        filteredTasks: state.filteredTasks.filter((task) => task.id !== optimistic.id),
      }))
      toast({ kind: 'error', title: translate('error.createTask'), description: getApiErrorMessage(error) })
      return null
    }
    }
  },

  updateTask: (id, patch, options) =>
    enqueue(id, async () => {
      const epoch = sessionEpoch
      const current = get().tasks.find((task) => task.id === id)
      if (!current || epoch !== sessionEpoch) return false

      const next: TaskPatch = { ...patch }
      if (patch.title !== undefined) {
        const title = patch.title.trim()
        if (!title) return false
        next.title = title
      }

      return guardLists(async () => {
      const statusChanged = next.status !== undefined && next.status !== current.status
      const optimistic: Task = {
        ...current,
        ...next,
        completedAt: !statusChanged
          ? current.completedAt
          : next.status === 'done'
            ? new Date().toISOString()
            : null,
        updatedAt: new Date().toISOString(),
      }
      const filter = get().statusFilter
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? optimistic : task)),
        filteredTasks: syncFiltered(state.filteredTasks, filter, optimistic),
      }))

      try {
        const updated = await tasksApi.update(id, next)
        if (epoch !== sessionEpoch) return false
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
          filteredTasks: syncFiltered(state.filteredTasks, state.statusFilter, updated),
        }))
        writeCache(current.userId, get())
        if (options?.toast === 'saved') {
          toast({ kind: 'success', title: translate('toast.taskSaved') })
        }
        return true
      } catch (error) {
        if (epoch !== sessionEpoch) return false
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? current : task)),
          filteredTasks:
            state.statusFilter === 'all'
              ? state.filteredTasks
              : syncFiltered(
                  state.filteredTasks.filter((task) => task.id !== id),
                  state.statusFilter,
                  current,
                ),
        }))
        toast({ kind: 'error', title: translate('error.saveTask'), description: getApiErrorMessage(error) })
        return false
      }
      })
    }),

  deleteTask: async (id) => {
    const epoch = sessionEpoch
    const task = get().tasks.find((item) => item.id === id)
    if (!task) return null
    const related = get().subtasks.filter((item) => item.task_id === id)

    return guardLists(async () => {
    set((state) => ({
      tasks: state.tasks.filter((item) => item.id !== id),
      filteredTasks: state.filteredTasks.filter((item) => item.id !== id),
      subtasks: state.subtasks.filter((item) => item.task_id !== id),
    }))

    try {
      await tasksApi.remove(id)
      if (epoch !== sessionEpoch) return null
      clearTaskDrafts(
        task.userId,
        id,
        related.map((item) => item.id),
      )
      writeCache(task.userId, get())
      return { task, subtasks: related }
    } catch (error) {
      if (epoch !== sessionEpoch) return null
      set((state) => ({
        tasks: state.tasks.some((item) => item.id === id) ? state.tasks : [...state.tasks, task],
        filteredTasks:
          state.statusFilter === 'all' || !matchesFilter(task, state.statusFilter)
            ? state.filteredTasks
            : state.filteredTasks.some((item) => item.id === id)
              ? state.filteredTasks
              : [...state.filteredTasks, task],
        subtasks: [
          ...state.subtasks,
          ...related.filter((item) => !state.subtasks.some((existing) => existing.id === item.id)),
        ],
      }))
      toast({ kind: 'error', title: translate('error.deleteTask'), description: getApiErrorMessage(error) })
      return null
    }
    })
  },

  restoreTask: (task, subtasks) => guardLists(async () => {
    const epoch = sessionEpoch
    set((state) => ({
      tasks: state.tasks.some((item) => item.id === task.id) ? state.tasks : [...state.tasks, task],
      subtasks: [
        ...state.subtasks,
        ...subtasks.filter((item) => !state.subtasks.some((existing) => existing.id === item.id)),
      ],
    }))
    try {
      const restored = await tasksApi.restore(task.id)
      if (epoch !== sessionEpoch) return
      set((state) => ({
        tasks: state.tasks.map((item) => (item.id === task.id ? restored.task : item)),
        filteredTasks: syncFiltered(state.filteredTasks, state.statusFilter, restored.task),
        subtasks: [
          ...state.subtasks.filter((item) => item.task_id !== task.id),
          ...restored.subtasks,
        ],
      }))
      writeCache(task.userId, get())
    } catch (error) {
      if (epoch !== sessionEpoch) return
      set((state) => ({
        tasks: state.tasks.filter((item) => item.id !== task.id),
        filteredTasks: state.filteredTasks.filter((item) => item.id !== task.id),
        subtasks: state.subtasks.filter((item) => item.task_id !== task.id),
      }))
      toast({ kind: 'error', title: translate('error.restoreTask'), description: getApiErrorMessage(error) })
    }
  }),

  duplicateTask: async (userId, task) =>
    get().createTask(
      userId,
      {
      title: translate('task.copyTitle', { title: task.title }),
      description: task.description,
      priority: task.priority,
      status: 'todo',
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      estimatedMinutes: task.estimatedMinutes,
      categoryId: task.categoryId,
      },
      { notify: false },
    ),

  reorderTasks: (orderedIds) => guardLists(async () => {
    const epoch = ++reorderEpoch
    const session = sessionEpoch
    const previous = get().tasks
    const items = assignSortOrders(previous, orderedIds)
    const positions = new Map(items.map((item) => [item.id, item.sortOrder]))
    const previousOrder = new Map(previous.map((task) => [task.id, task.sortOrder]))

    set({
      tasks: previous.map((task) => {
        const position = positions.get(task.id)
        return position === undefined ? task : { ...task, sortOrder: position }
      }),
    })

    try {
      const tasks = await tasksApi.reorder(items)
      if (epoch !== reorderEpoch || session !== sessionEpoch) return
      const fresh = new Map(tasks.map((task) => [task.id, task.sortOrder]))
      set((state) => ({
        tasks: state.tasks.map((task) =>
          fresh.has(task.id) ? { ...task, sortOrder: fresh.get(task.id) ?? task.sortOrder } : task,
        ),
      }))
      const owner = tasks[0]?.userId ?? previous[0]?.userId
      if (owner) writeCache(owner, get())
    } catch (error) {
      if (epoch !== reorderEpoch || session !== sessionEpoch) return
      set((state) => ({
        tasks: state.tasks.map((task) =>
          previousOrder.has(task.id)
            ? { ...task, sortOrder: previousOrder.get(task.id) ?? task.sortOrder }
            : task,
        ),
      }))
      toast({ kind: 'error', title: translate('error.reorder'), description: getApiErrorMessage(error) })
    }
  }),

  createCategory: async (userId, name, icon) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await guardLists(async () => {
    try {
      const created = await categoriesApi.create(trimmed, icon)
      set((state) => ({ categories: [...state.categories, created] }))
      writeCache(userId, get())
    } catch (error) {
      toast({ kind: 'error', title: translate('error.createCategory'), description: getApiErrorMessage(error) })
    }
    })
  },

  deleteCategory: async (id) => {
    const previousCategories = get().categories
    const previousTasks = get().tasks
    const previousFiltered = get().filteredTasks
    const owner = previousCategories.find((item) => item.id === id)?.user_id

    await guardLists(async () => {
    set({
      categories: previousCategories.filter((item) => item.id !== id),
      tasks: previousTasks.map((task) => (task.categoryId === id ? { ...task, categoryId: null } : task)),
      filteredTasks: previousFiltered.map((task) =>
        task.categoryId === id ? { ...task, categoryId: null } : task,
      ),
    })

    try {
      await categoriesApi.remove(id)
      if (owner) writeCache(owner, get())
    } catch (error) {
      set({ categories: previousCategories, tasks: previousTasks, filteredTasks: previousFiltered })
      toast({ kind: 'error', title: translate('error.deleteCategory'), description: getApiErrorMessage(error) })
    }
    })
  },

  addSubtask: async (userId, taskId, title) => {
    const trimmed = title.trim()
    if (!trimmed) return
    await guardLists(async () => {
    try {
      const created = await tasksApi.addSubtask(taskId, trimmed)
      set((state) => ({ subtasks: [...state.subtasks, created] }))
      writeCache(userId, get())
    } catch (error) {
      toast({ kind: 'error', title: translate('error.addSubtask'), description: getApiErrorMessage(error) })
    }
    })
  },

  updateSubtask: (id, patch) =>
    enqueue(`subtask:${id}`, async () => {
      const epoch = sessionEpoch
      const current = get().subtasks.find((item) => item.id === id)
      if (!current || epoch !== sessionEpoch) return false
      if (patch.title !== undefined && !patch.title.trim()) return false

      return guardLists(async () => {
      set((state) => ({
        subtasks: state.subtasks.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }))

      try {
        const updated = await tasksApi.updateSubtask(id, patch)
        if (epoch !== sessionEpoch) return false
        set((state) => ({
          subtasks: state.subtasks.map((item) => (item.id === id ? updated : item)),
        }))
        writeCache(current.user_id, get())
        return true
      } catch (error) {
        if (epoch !== sessionEpoch) return false
        set((state) => ({
          subtasks: state.subtasks.map((item) => (item.id === id ? current : item)),
        }))
        toast({ kind: 'error', title: translate('error.saveSubtask'), description: getApiErrorMessage(error) })
        return false
      }
      })
    }),

  deleteSubtask: async (id) => {
    const previous = get().subtasks
    const current = previous.find((item) => item.id === id)
    if (!current) return

    await guardLists(async () => {
    set({ subtasks: previous.filter((item) => item.id !== id) })

    try {
      await tasksApi.removeSubtask(id)
      useDraftStore.getState().clearDraft(subtaskDraftKey(current.user_id, id))
      writeCache(current.user_id, get())
    } catch (error) {
      set({ subtasks: previous })
      toast({ kind: 'error', title: translate('error.deleteSubtask'), description: getApiErrorMessage(error) })
    }
    })
  },
}))

export const useTasksStore = useDataStore
