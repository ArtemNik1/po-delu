import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { Category, Subtask, Task, UserSettings } from '../types/database'
import type { MeResponse } from './authApi'

export const DEMO_TOKEN = 'po-delu-local-demo-v1'
const STORAGE_KEY = 'po-delu.demo.v1'
const USER_ID = 'demo-user'

type DemoTask = Task & { deletedAt?: string | null }
interface DemoData {
  version: 1
  me: MeResponse
  tasks: DemoTask[]
  categories: Category[]
  subtasks: Subtask[]
}

let memory: DemoData | null = null

export function isDemoToken(token: string | null): boolean {
  return token === DEMO_TOKEN
}

function dateAt(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function seed(): DemoData {
  const now = new Date().toISOString()
  const settings: UserSettings = {
    user_id: USER_ID, theme: 'dark', language: null, week_starts_on: 1,
    daily_goal: 5, sound_enabled: false, onboarding_completed: true,
    created_at: now, updated_at: now,
  }
  const categories: Category[] = [
    { id: 'demo-work', user_id: USER_ID, name: 'Работа', icon: 'briefcase', created_at: now },
    { id: 'demo-personal', user_id: USER_ID, name: 'Личное', icon: 'heart', created_at: now },
  ]
  const examples: [string, Task['status'], Task['priority'], number, string][] = [
    ['Подготовить структуру сайта', 'in_progress', 'high', 0, 'demo-work'],
    ['Согласовать карточку товара', 'todo', 'medium', 0, 'demo-work'],
    ['Запланировать тренировку', 'todo', 'low', 0, 'demo-personal'],
    ['Проверить мобильную версию', 'todo', 'high', 1, 'demo-work'],
    ['Обновить портфолио', 'todo', 'medium', 3, 'demo-work'],
    ['Собрать материалы для проекта', 'done', 'medium', -1, 'demo-work'],
  ]
  const tasks: DemoTask[] = examples.map(([title, status, priority, offset, categoryId], index) => ({
    id: `demo-task-${index + 1}`, userId: USER_ID, title, status, priority,
    description: index === 0 ? 'Откройте детали, добавьте подзадачу или измените срок. Это отдельные демонстрационные данные.' : '',
    dueDate: dateAt(offset), dueTime: null, estimatedMinutes: 25,
    categoryId, sortOrder: index + 1, completedAt: status === 'done' ? now : null,
    createdAt: now, updatedAt: now,
  }))
  return {
    version: 1,
    me: { id: USER_ID, email: 'demo@example.invalid', displayName: 'Гость',
      profile: { id: USER_ID, display_name: 'Гость', avatar_url: null, created_at: now, updated_at: now }, settings },
    categories, tasks,
    subtasks: [{ id: 'demo-subtask-1', task_id: 'demo-task-1', user_id: USER_ID, title: 'Определить основные страницы', completed: true, sort_order: 1, created_at: now },
      { id: 'demo-subtask-2', task_id: 'demo-task-1', user_id: USER_ID, title: 'Описать путь посетителя', completed: false, sort_order: 2, created_at: now }],
  }
}

function data(): DemoData {
  if (memory) return memory
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && typeof saved === 'object' && 'version' in saved && saved.version === 1
      && 'me' in saved && 'tasks' in saved && Array.isArray(saved.tasks)
      && 'categories' in saved && Array.isArray(saved.categories)
      && 'subtasks' in saved && Array.isArray(saved.subtasks)) {
      memory = saved as DemoData
      return memory
    }
  } catch { /* Start with fresh data when storage is unavailable or corrupt. */ }
  memory = seed()
  return memory
}

function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)) } catch { /* In-memory demo remains usable. */ }
}

export function demoAccount(): MeResponse {
  return structuredClone(data().me)
}

/** Clears only the isolated demo dataset; real API data is never touched. */
export function resetDemoData(): void {
  memory = seed()
  persist()
}

function response(config: InternalAxiosRequestConfig, value: unknown, status = 200): AxiosResponse {
  return { data: structuredClone(value), status, statusText: status < 400 ? 'OK' : 'Error', headers: new AxiosHeaders(), config }
}

function fail(config: InternalAxiosRequestConfig, message: string, status = 404): never {
  throw new AxiosError(message, 'ERR_BAD_REQUEST', config, undefined, response(config, { message }, status))
}

function bodyOf(config: InternalAxiosRequestConfig): Record<string, unknown> {
  const value: unknown = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function publicTask(task: DemoTask): Task {
  const { deletedAt: _deletedAt, ...publicValue } = task
  return publicValue
}

export const demoAdapter: AxiosAdapter = async (config) => {
  const db = data()
  const path = (config.url || '').split('?')[0].replace(/\/$/, '')
  const method = (config.method || 'get').toLowerCase()
  const payload = bodyOf(config)
  const now = new Date().toISOString()
  const taskById = (id: string, deleted = false) => {
    const task = db.tasks.find((item) => item.id === id && Boolean(item.deletedAt) === deleted)
    if (!task) return fail(config, 'Task not found')
    return task
  }
  let result: unknown

  if (path === '/auth/me' && method === 'get') result = db.me
  else if (path === '/users/me' && method === 'patch') {
    if (typeof payload.displayName === 'string') {
      db.me.displayName = payload.displayName.trim()
      db.me.profile.display_name = db.me.displayName
      db.me.profile.updated_at = now
    }
    result = db.me
  } else if (path === '/users/me/settings' && method === 'patch') {
    const fields = { theme: 'theme', language: 'language', dailyGoal: 'daily_goal', soundEnabled: 'sound_enabled', onboardingCompleted: 'onboarding_completed' } as const
    const patch: Record<string, unknown> = {}
    for (const [from, to] of Object.entries(fields)) if (payload[from] !== undefined) patch[to] = payload[from]
    db.me.settings = { ...db.me.settings!, ...patch, week_starts_on: 1, updated_at: now }
    result = db.me
  } else if (path === '/tasks/subtasks/all' && method === 'get') {
    result = db.subtasks.filter((subtask) => db.tasks.some((task) => task.id === subtask.task_id && !task.deletedAt))
  } else if (path === '/tasks/reorder' && method === 'patch') {
    const items = payload.items as { id: string; sortOrder: number }[]
    for (const item of items) taskById(item.id).sortOrder = item.sortOrder
    result = db.tasks.filter((task) => !task.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder).map(publicTask)
  } else if (path === '/tasks' && method === 'get') {
    const status = config.params?.status
    result = db.tasks.filter((task) => !task.deletedAt && (!status || task.status === status))
      .sort((a, b) => a.sortOrder - b.sortOrder).map(publicTask)
  } else if (path === '/tasks' && method === 'post') {
    if (typeof payload.title !== 'string' || !payload.title.trim() || typeof payload.dueDate !== 'string') fail(config, 'Title and dueDate are required', 400)
    const task: Task = {
      id: crypto.randomUUID(), userId: USER_ID, title: (payload.title as string).trim(),
      description: String(payload.description ?? ''), status: (payload.status as Task['status']) ?? 'todo',
      priority: (payload.priority as Task['priority']) ?? 'medium', dueDate: payload.dueDate as string,
      dueTime: (payload.dueTime as string | null) ?? null, estimatedMinutes: (payload.estimatedMinutes as number | null) ?? null,
      categoryId: (payload.categoryId as string | null) ?? null, sortOrder: (payload.sortOrder as number) ?? db.tasks.length + 1,
      completedAt: payload.status === 'done' ? now : null, createdAt: now, updatedAt: now,
    }
    db.tasks.push(task)
    result = task
  } else if (/^\/tasks\/[^/]+\/restore$/.test(path) && method === 'post') {
    const task = taskById(path.split('/')[2], true)
    task.deletedAt = null
    result = { task: publicTask(task), subtasks: db.subtasks.filter((item) => item.task_id === task.id) }
  } else if (/^\/tasks\/[^/]+\/subtasks$/.test(path) && method === 'post') {
    const task = taskById(path.split('/')[2])
    const subtask: Subtask = {
      id: crypto.randomUUID(), task_id: task.id, user_id: USER_ID, title: String(payload.title || '').trim(),
      completed: false, sort_order: db.subtasks.filter((item) => item.task_id === task.id).length + 1, created_at: now,
    }
    db.subtasks.push(subtask)
    result = subtask
  } else if (/^\/tasks\/[^/]+$/.test(path)) {
    const task = taskById(path.split('/')[2])
    if (method === 'patch') {
      const fields = ['title', 'description', 'priority', 'status', 'dueDate', 'dueTime', 'estimatedMinutes', 'categoryId', 'sortOrder'] as const
      const patch: Record<string, unknown> = {}
      for (const field of fields) if (payload[field] !== undefined) patch[field] = payload[field]
      if (payload.status && payload.status !== task.status) task.completedAt = payload.status === 'done' ? now : null
      Object.assign(task, patch, { updatedAt: now })
      result = publicTask(task)
    } else if (method === 'delete') { task.deletedAt = now; result = { ok: true } }
    else if (method === 'get') result = publicTask(task)
    else fail(config, 'Unsupported demo request')
  } else if (/^\/tasks\/subtasks\/[^/]+$/.test(path)) {
    const id = path.split('/')[3]
    const subtask = db.subtasks.find((item) => item.id === id)
    if (!subtask) return fail(config, 'Subtask not found')
    taskById(subtask.task_id)
    if (method === 'patch') {
      if (typeof payload.title === 'string') subtask.title = payload.title.trim()
      if (typeof payload.completed === 'boolean') subtask.completed = payload.completed
      if (typeof payload.sortOrder === 'number') subtask.sort_order = payload.sortOrder
      result = subtask
    } else if (method === 'delete') { db.subtasks = db.subtasks.filter((item) => item.id !== id); result = { ok: true } }
    else fail(config, 'Unsupported demo request')
  } else if (path === '/categories' && method === 'get') result = db.categories
  else if (path === '/categories' && method === 'post') {
    const category: Category = { id: crypto.randomUUID(), user_id: USER_ID, name: String(payload.name || '').trim(), icon: String(payload.icon || 'sparkles'), created_at: now }
    db.categories.push(category)
    result = category
  } else if (/^\/categories\/[^/]+$/.test(path) && method === 'delete') {
    const id = path.split('/')[2]
    db.categories = db.categories.filter((item) => item.id !== id)
    db.tasks.forEach((task) => { if (task.categoryId === id) task.categoryId = null })
    result = { ok: true }
  } else fail(config, 'Unsupported demo request')

  if (method !== 'get') persist()
  return response(config, result, method === 'post' ? 201 : 200)
}
