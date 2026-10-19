// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosHeaders } from 'axios'
import { api, setStoredToken } from './api'
import { DEMO_TOKEN, demoAdapter, resetDemoData } from './demoApi'
import type { Subtask, Task } from '../types/database'

const client = axios.create({ adapter: demoAdapter })
beforeEach(() => {
  localStorage.clear()
  resetDemoData()
  setStoredToken(null)
})

describe('isolated portfolio demo', () => {
  it('routes only the explicit demo token to local data', async () => {
    const remote = vi.fn(async (config) => ({ data: [], status: 200, statusText: 'OK', config, headers: new AxiosHeaders() }))
    setStoredToken(DEMO_TOKEN)
    const demo = await api.get<Task[]>('/tasks', { adapter: remote })
    expect(demo.data.length).toBeGreaterThan(0)
    expect(remote).not.toHaveBeenCalled()
    setStoredToken('real-account-token')
    await api.get('/tasks', { adapter: remote })
    expect(remote).toHaveBeenCalledOnce()
  })

  it('creates, completes, filters, deletes and restores a task with its subtasks', async () => {
    const created = await client.post<Task>('/tasks', { title: 'Проверить каталог', dueDate: '2026-10-19' })
    const id = created.data.id
    await client.post(`/tasks/${id}/subtasks`, { title: 'Открыть карточку' })
    const completed = await client.patch<Task>(`/tasks/${id}`, { status: 'done' })
    expect(completed.data.completedAt).not.toBeNull()
    expect((await client.get<Task[]>('/tasks', { params: { status: 'done' } })).data.map((task) => task.id)).toContain(id)
    await client.delete(`/tasks/${id}`)
    expect((await client.get<Task[]>('/tasks')).data.map((task) => task.id)).not.toContain(id)
    const restored = await client.post<{ task: Task; subtasks: Subtask[] }>(`/tasks/${id}/restore`)
    expect(restored.data.subtasks.map((item) => item.title)).toEqual(['Открыть карточку'])
    expect(restored.data.task.completedAt).toBe(completed.data.completedAt)
    const reopened = await client.patch<Task>(`/tasks/${id}`, { status: 'todo' })
    expect(reopened.data.completedAt).toBeNull()
  })

  it('persists edits when the demo module is loaded again', async () => {
    const created = await client.post<Task>('/tasks', { title: 'После перезагрузки', dueDate: '2026-10-19' })
    vi.resetModules()
    const fresh = await import('./demoApi')
    const reloaded = axios.create({ adapter: fresh.demoAdapter })
    expect((await reloaded.get<Task[]>('/tasks')).data.some((task) => task.id === created.data.id)).toBe(true)
  })

  it('resets only demo data and rejects unsupported requests', async () => {
    localStorage.setItem('another-account-data', 'keep')
    resetDemoData()
    expect(localStorage.getItem('another-account-data')).toBe('keep')
    await expect(client.post('/unsupported')).rejects.toMatchObject({ response: { status: 404 } })
  })
})
