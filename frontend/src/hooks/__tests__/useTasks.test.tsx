// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useDataStore } from '../../store/dataStore'
import type { Subtask, Task } from '../../types/database'
import { useSubtasksOf } from '../useTasks'

function task(id: string): Task {
  return {
    id,
    userId: 'user-1',
    title: `Task ${id}`,
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-09-03',
    dueTime: null,
    estimatedMinutes: null,
    categoryId: null,
    sortOrder: 1,
    completedAt: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  }
}

function subtask(id: string, taskId: string): Subtask {
  return {
    id,
    task_id: taskId,
    user_id: 'user-1',
    title: `Subtask ${id}`,
    completed: false,
    sort_order: 1,
    created_at: '2026-09-01T10:00:00.000Z',
  }
}

interface Recorder {
  renders: number
  results: (Subtask[] | null)[]
}

function Probe({ taskId, onRender }: { taskId: string; onRender: (value: Subtask[]) => void }) {
  const subtasks = useSubtasksOf(taskId)
  onRender(subtasks)
  return <span>{subtasks.length}</span>
}

/** Mounts a probe that records every render and the value it observed. */
function mountProbe(taskId: string): Recorder {
  const recorder: Recorder = { renders: 0, results: [] }
  const record = (value: Subtask[]) => {
    recorder.renders += 1
    recorder.results.push(value)
  }
  render(<Probe taskId={taskId} onRender={record} />)
  return recorder
}

afterEach(() => {
  cleanup()
  useDataStore.setState({ tasks: [], categories: [], subtasks: [] })
})

/**
 * Regression guard: Zustand v5 re-renders whenever a selector returns a new
 * reference, so a selector that filtered inline froze the app in an infinite
 * render loop. Derived lists must stay referentially stable.
 */
describe('useSubtasksOf', () => {
  it('returns only the subtasks of the given task', () => {
    useDataStore.setState({
      tasks: [task('a'), task('b')],
      subtasks: [subtask('1', 'a'), subtask('2', 'b'), subtask('3', 'a')],
    })

    const recorder = mountProbe('a')
    expect(recorder.results.at(-1)?.map((item) => item.id)).toEqual(['1', '3'])
  })

  it('settles after a single render instead of looping', () => {
    useDataStore.setState({ subtasks: [subtask('1', 'a')] })

    const recorder = mountProbe('a')
    expect(recorder.renders).toBe(1)
  })

  it('keeps the same reference when unrelated store slices change', () => {
    useDataStore.setState({ tasks: [task('a')], subtasks: [subtask('1', 'a')] })

    const recorder = mountProbe('a')
    const before = recorder.results.at(-1)

    act(() => {
      useDataStore.setState({ tasks: [task('a'), task('b')] })
    })

    expect(recorder.results.at(-1)).toBe(before)
  })

  it('produces a new list only when the subtasks actually change', () => {
    useDataStore.setState({ subtasks: [subtask('1', 'a')] })

    const recorder = mountProbe('a')
    const before = recorder.results.at(-1)

    act(() => {
      useDataStore.setState({ subtasks: [subtask('1', 'a'), subtask('2', 'a')] })
    })

    const after = recorder.results.at(-1)
    expect(after).not.toBe(before)
    expect(after).toHaveLength(2)
  })

  it('returns an empty list when nothing is selected', () => {
    useDataStore.setState({ subtasks: [subtask('1', 'a')] })

    const recorder = mountProbe('')
    expect(recorder.results.at(-1)).toEqual([])
  })
})
