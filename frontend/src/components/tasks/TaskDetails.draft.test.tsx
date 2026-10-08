// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { taskDraftKey, useDraftStore } from '../../store/draftStore'
import { useUiStore } from '../../store/uiStore'
import { tasksApi } from '../../services/tasksApi'
import type { Subtask, Task } from '../../types/database'
import { TaskDetails } from './TaskDetails'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Старое',
    description: 'Было',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-10-04',
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

function step(title = 'Шаг'): Subtask {
  return {
    id: 'sub-1',
    task_id: 'task-1',
    user_id: 'user-1',
    title,
    completed: false,
    sort_order: 1,
    created_at: '2026-10-01T00:00:00.000Z',
  }
}

function panel() {
  return render(
    <MemoryRouter>
      <TaskDetails />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  useDraftStore.setState({ drafts: {} })
  useDataStore.getState().reset()
  useUiStore.setState({ selectedTaskId: 'task-1', confirm: null })
  useAuthStore.setState({
    user: { id: 'user-1', email: 'a@b.c', displayName: 'A' },
    settings: null,
  })
  useDataStore.setState({
    tasks: [task()],
    subtasks: [step()],
    bootstrapped: true,
  })
})

afterEach(() => {
  cleanup()
})

describe('editor drafts', () => {
  it('keeps a task draft when closing the panel fails, and ignores a stale task payload', async () => {
    vi.spyOn(tasksApi, 'update').mockRejectedValue(new Error('500'))
    panel()

    const title = screen.getByLabelText('Название')
    const notes = screen.getByLabelText('Заметки')
    fireEvent.change(title, { target: { value: 'Черновик' } })
    fireEvent.change(notes, { target: { value: 'Новые заметки' } })

    useDataStore.setState({ tasks: [task({ title: 'Старое', description: 'Было' })] })
    expect((screen.getByLabelText('Название') as HTMLInputElement).value).toBe('Черновик')
    expect((screen.getByLabelText('Заметки') as HTMLTextAreaElement).value).toBe('Новые заметки')

    useUiStore.getState().selectTask(null)
    await vi.waitFor(() =>
      expect(tasksApi.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ title: 'Черновик', description: 'Новые заметки' }),
      ),
    )
    expect(useDataStore.getState().tasks[0]?.title).toBe('Старое')

    useUiStore.getState().selectTask('task-1')
    expect(((await screen.findByLabelText('Название')) as HTMLInputElement).value).toBe('Черновик')
    expect((screen.getByLabelText('Заметки') as HTMLTextAreaElement).value).toBe('Новые заметки')
    expect(useDraftStore.getState().drafts[taskDraftKey('user-1', 'task-1', 'title')]).toBe('Черновик')
  })

  it('keeps a subtask draft when the panel closes during a failed save', async () => {
    vi.spyOn(tasksApi, 'updateSubtask').mockRejectedValue(new Error('500'))
    panel()

    fireEvent.change(screen.getByRole('textbox', { name: 'Подзадача: Шаг' }), {
      target: { value: 'Черновик шага' },
    })
    useUiStore.getState().selectTask(null)
    await vi.waitFor(() => expect(tasksApi.updateSubtask).toHaveBeenCalled())
    expect(useDataStore.getState().subtasks[0]?.title).toBe('Шаг')

    useUiStore.getState().selectTask('task-1')
    expect(
      ((await screen.findByRole('textbox', { name: 'Подзадача: Шаг' })) as HTMLInputElement).value,
    ).toBe('Черновик шага')
  })

  it('drops a draft when the text is reverted or the task is deleted', async () => {
    vi.spyOn(tasksApi, 'update').mockRejectedValue(new Error('500'))
    vi.spyOn(tasksApi, 'remove').mockResolvedValue(undefined)
    panel()
    const title = screen.getByLabelText('Название')
    fireEvent.change(title, { target: { value: 'Черновик' } })
    fireEvent.change(title, { target: { value: 'Старое' } })
    expect(useDraftStore.getState().drafts[taskDraftKey('user-1', 'task-1', 'title')]).toBeUndefined()

    fireEvent.change(title, { target: { value: 'Черновик' } })
    await useDataStore.getState().deleteTask('task-1')
    expect(useDraftStore.getState().drafts[taskDraftKey('user-1', 'task-1', 'title')]).toBeUndefined()
  })

  it('clears drafts when the account signs out', async () => {
    useDraftStore.getState().setDraft(taskDraftKey('user-1', 'task-1', 'title'), 'Черновик')
    await useAuthStore.getState().signOut()
    expect(useDraftStore.getState().drafts[taskDraftKey('user-1', 'task-1', 'title')]).toBeUndefined()
  })
})
