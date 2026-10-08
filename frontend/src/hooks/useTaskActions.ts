import { useCallback } from 'react'
import { translate } from '../lib/i18n'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { toast } from '../store/toastStore'
import { useUiStore } from '../store/uiStore'
import type { Status, Task } from '../types/database'
import { addDaysIso } from '../utils/dates'
import { playCompleteSound } from '../utils/misc'

/** Shared task verbs so rows, the detail panel and Focus mode behave identically. */
export function useTaskActions() {
  const updateTask = useDataStore((state) => state.updateTask)
  const deleteTask = useDataStore((state) => state.deleteTask)
  const restoreTask = useDataStore((state) => state.restoreTask)
  const duplicateTask = useDataStore((state) => state.duplicateTask)
  const soundEnabled = useAuthStore((state) => state.settings?.sound_enabled ?? true)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const selectTask = useUiStore((state) => state.selectTask)
  const requestConfirm = useUiStore((state) => state.requestConfirm)

  const setStatus = useCallback(
    async (task: Task, status: Status) => {
      if (task.status === status) return true
      const ok = await updateTask(task.id, { status })
      if (ok && status === 'done' && soundEnabled) playCompleteSound()
      return ok
    },
    [updateTask, soundEnabled],
  )

  const setCompleted = useCallback(
    async (task: Task, completed: boolean) => setStatus(task, completed ? 'done' : 'todo'),
    [setStatus],
  )

  const moveToTomorrow = useCallback(
    async (task: Task) => {
      const next = addDaysIso(1)
      const ok = await updateTask(task.id, { dueDate: next })
      if (!ok) return false
      toast({ kind: 'info', title: translate('toast.movedToTomorrow'), description: task.title })
      return true
    },
    [updateTask],
  )

  const scheduleFor = useCallback(
    async (task: Task, date: string | null) => {
      if (!date) return
      await updateTask(task.id, { dueDate: date })
    },
    [updateTask],
  )

  const remove = useCallback(
    async (task: Task) => {
      const removed = await deleteTask(task.id)
      if (!removed) return
      if (useUiStore.getState().selectedTaskId === task.id) selectTask(null)
      toast({
        kind: 'info',
        title: translate('toast.taskDeleted'),
        description: task.title,
        action: {
          label: translate('common.undo'),
          onClick: () => void restoreTask(removed.task, removed.subtasks),
        },
      })
    },
    [deleteTask, restoreTask, selectTask],
  )

  const confirmRemove = useCallback(
    (task: Task) => {
      requestConfirm({
        title: translate('confirm.deleteTask.title'),
        description: translate('confirm.deleteTask.description', { title: task.title }),
        confirmLabel: translate('confirm.deleteTask.confirm'),
        tone: 'danger',
        onConfirm: () => void remove(task),
      })
    },
    [requestConfirm, remove],
  )

  const duplicate = useCallback(
    async (task: Task) => {
      if (!userId) return
      const created = await duplicateTask(userId, task)
      if (created) {
        toast({ kind: 'success', title: translate('toast.taskDuplicated'), description: created.title })
        selectTask(created.id)
      }
    },
    [duplicateTask, userId, selectTask],
  )

  return { setCompleted, setStatus, moveToTomorrow, scheduleFor, remove, confirmRemove, duplicate }
}
