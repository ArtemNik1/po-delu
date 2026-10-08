// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { tasksApi } from '../services/tasksApi'
import { useDataStore } from '../store/dataStore'
import { useToastStore } from '../store/toastStore'
import { useUiStore } from '../store/uiStore'
import type { Task } from '../types/database'
import { FocusPage } from './FocusPage'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function task(): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Фокус',
    description: '',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2026-10-04',
    dueTime: null,
    estimatedMinutes: 25,
    categoryId: null,
    sortOrder: 0,
    completedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  }
}

function finishedSession() {
  sessionStorage.setItem(
    'po-delu.focus.session',
    JSON.stringify({
      taskId: 'task-1',
      durationMinutes: 25,
      running: true,
      endsAt: Date.now() - 5000,
      remaining: 0,
      paused: false,
    }),
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  useToastStore.getState().clear()
  useDataStore.getState().reset()
  useUiStore.setState({ confirm: null })
  useDataStore.setState({ tasks: [task()], bootstrapped: true })
  finishedSession()
})

afterEach(() => {
  cleanup()
})

function renderFocus() {
  return render(
    <MemoryRouter initialEntries={['/focus/task-1']}>
      <Routes>
        <Route
          path="/focus/:taskId"
          element={
            <>
              <FocusPage />
              <ConfirmDialog />
            </>
          }
        />
        <Route path="/" element={<div>home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Focus completion dialog', () => {
  it('stays on the session when marking done fails and retries after success', async () => {
    const pending = deferred<Task>()
    const update = vi.spyOn(tasksApi, 'update').mockImplementation(() => pending.promise)
    renderFocus()

    const confirm = await screen.findByRole('button', { name: 'Отметить выполненной' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1))

    pending.reject(new Error('500'))
    await vi.waitFor(() => {
      expect(useToastStore.getState().toasts.some((item) => item.title === 'Не удалось сохранить задачу')).toBe(true)
    })
    expect(screen.getByRole('dialog', { name: 'Сессия завершена' })).toBeTruthy()
    expect(screen.queryByText('home')).toBeNull()
    expect(useDataStore.getState().tasks[0]?.status).toBe('in_progress')
    expect(sessionStorage.getItem('po-delu.focus.session')).toBeTruthy()

    update.mockResolvedValue({ ...task(), status: 'done' })
    fireEvent.click(screen.getByRole('button', { name: 'Отметить выполненной' }))
    expect(await screen.findByText('home')).toBeTruthy()
    expect(sessionStorage.getItem('po-delu.focus.session')).toBeNull()
    expect(useDataStore.getState().tasks[0]?.status).toBe('done')
  })
})

describe('manual finish button', () => {
  beforeEach(() => {
    sessionStorage.removeItem('po-delu.focus.session')
  })

  it('ignores repeated clicks until a delayed success is confirmed', async () => {
    const pending = deferred<Task>()
    const update = vi.spyOn(tasksApi, 'update').mockImplementation(() => pending.promise)
    renderFocus()

    const finish = screen.getByRole('button', { name: 'Завершить' })
    fireEvent.click(finish)
    fireEvent.click(finish)
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    expect(finish).toHaveProperty('disabled', true)
    expect(finish.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByText('home')).toBeNull()
    expect(sessionStorage.getItem('po-delu.focus.session')).toBeTruthy()
    expect(useDataStore.getState().tasks[0]?.status).toBe('done')

    pending.resolve({ ...task(), status: 'done' })
    expect(await screen.findByText('home')).toBeTruthy()
    expect(sessionStorage.getItem('po-delu.focus.session')).toBeNull()
    expect(useDataStore.getState().tasks[0]?.status).toBe('done')
    expect(useToastStore.getState().toasts.some((item) => item.kind === 'success')).toBe(true)
  })

  it('keeps the session when finish fails and allows another attempt', async () => {
    const pending = deferred<Task>()
    const update = vi.spyOn(tasksApi, 'update').mockImplementation(() => pending.promise)
    renderFocus()

    const finish = screen.getByRole('button', { name: 'Завершить' })
    fireEvent.click(finish)
    fireEvent.click(finish)
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1))

    pending.reject(new Error('500'))
    await vi.waitFor(() => {
      expect(useToastStore.getState().toasts.some((item) => item.title === 'Не удалось сохранить задачу')).toBe(true)
    })
    expect(screen.queryByText('home')).toBeNull()
    expect(useDataStore.getState().tasks[0]?.status).toBe('in_progress')
    expect(sessionStorage.getItem('po-delu.focus.session')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Завершить' })).toHaveProperty('disabled', false)

    update.mockResolvedValue({ ...task(), status: 'done' })
    fireEvent.click(screen.getByRole('button', { name: 'Завершить' }))
    expect(await screen.findByText('home')).toBeTruthy()
    expect(sessionStorage.getItem('po-delu.focus.session')).toBeNull()
    expect(useDataStore.getState().tasks[0]?.status).toBe('done')
  })
})
