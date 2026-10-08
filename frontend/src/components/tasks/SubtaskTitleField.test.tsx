// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { subtaskDraftKey, useDraftStore } from '../../store/draftStore'
import type { Subtask } from '../../types/database'
import { SubtaskTitleField } from './SubtaskTitleField'

function subtask(title = 'Step alpha'): Subtask {
  return {
    id: 'sub-1',
    task_id: 'task-1',
    user_id: 'user-1',
    title,
    completed: false,
    sort_order: 1,
    created_at: '2026-10-02T10:00:00.000Z',
  }
}

afterEach(() => {
  cleanup()
  useDraftStore.setState({ drafts: {} })
  sessionStorage.clear()
})

describe('SubtaskTitleField', () => {
  it('saves the latest draft when the field unmounts without a blur', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const view = render(<SubtaskTitleField subtask={subtask()} label="Subtask" onSave={onSave} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Step renamed' } })
    view.unmount()
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith('sub-1', 'Step renamed'))
  })

  it('saves on Enter and on blur', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    render(<SubtaskTitleField subtask={subtask()} label="Subtask" onSave={onSave} />)
    const field = screen.getByRole('textbox')
    fireEvent.change(field, { target: { value: 'Via enter' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith('sub-1', 'Via enter'))

    fireEvent.change(field, { target: { value: 'Via blur' } })
    fireEvent.blur(field)
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith('sub-1', 'Via blur'))
  })

  it('keeps the draft when saving fails', async () => {
    const onSave = vi.fn().mockResolvedValue(false)
    render(<SubtaskTitleField subtask={subtask()} label="Subtask" onSave={onSave} />)
    const field = screen.getByRole('textbox')
    fireEvent.change(field, { target: { value: 'Keep me' } })
    fireEvent.blur(field)
    await vi.waitFor(() => expect(onSave).toHaveBeenCalled())
    expect((field as HTMLInputElement).value).toBe('Keep me')
  })

  it('shows the failed draft again after the field is closed and reopened', async () => {
    const onSave = vi.fn().mockResolvedValue(false)
    const view = render(<SubtaskTitleField subtask={subtask('Old step')} label="Subtask" onSave={onSave} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Draft step' } })
    view.unmount()
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith('sub-1', 'Draft step'))

    render(<SubtaskTitleField subtask={subtask('Old step')} label="Subtask" onSave={onSave} />)
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Draft step')
    expect(useDraftStore.getState().drafts[subtaskDraftKey('user-1', 'sub-1')]).toBe('Draft step')
  })
})
