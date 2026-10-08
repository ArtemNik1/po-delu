import { AnimatePresence, motion } from 'framer-motion'
import { Copy, Timer, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubtasksOf } from '../../hooks/useTasks'
import { useTaskActions } from '../../hooks/useTaskActions'
import { useTranslation } from '../../hooks/useTranslation'
import {
  PRIORITIES,
  PRIORITY_KEY,
  PRIORITY_MARK,
  STATUSES,
  STATUS_KEY,
  STATUS_MARK,
  withMark,
} from '../../lib/constants'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { taskDraftKey, useDraftStore } from '../../store/draftStore'
import { useUiStore } from '../../store/uiStore'
import type { Priority, Status, Task, TaskPatch } from '../../types/database'
import { formatShortDate } from '../../utils/dates'
import { isDone, subtaskProgress } from '../../utils/tasks'
import { Button, IconButton } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { SubtaskTitleField } from './SubtaskTitleField'

const AUTOSAVE_MS = 500

export function TaskDetails() {
  const selectedTaskId = useUiStore((state) => state.selectedTaskId)
  const task = useDataStore((state) => state.tasks.find((item) => item.id === selectedTaskId) ?? null)

  return (
    <AnimatePresence>
      {task ? <TaskDetailsPanel key={task.id} task={task} /> : null}
    </AnimatePresence>
  )
}

function TaskDetailsPanel({ task }: { task: Task }) {
  const selectTask = useUiStore((state) => state.selectTask)
  const categories = useDataStore((state) => state.categories)
  const updateTask = useDataStore((state) => state.updateTask)
  const addSubtask = useDataStore((state) => state.addSubtask)
  const updateSubtask = useDataStore((state) => state.updateSubtask)
  const deleteSubtask = useDataStore((state) => state.deleteSubtask)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const subtasks = useSubtasksOf(task.id)
  const { confirmRemove, duplicate } = useTaskActions()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const titleKey = userId ? taskDraftKey(userId, task.id, 'title') : null
  const descriptionKey = userId ? taskDraftKey(userId, task.id, 'description') : null
  const titleDraft = useDraftStore((state) => (titleKey ? state.drafts[titleKey] : undefined))
  const descriptionDraft = useDraftStore((state) =>
    descriptionKey ? state.drafts[descriptionKey] : undefined,
  )
  const [newSubtask, setNewSubtask] = useState('')
  const panelRef = useRef<HTMLElement | null>(null)

  const title = titleDraft ?? task.title
  const description = descriptionDraft ?? task.description ?? ''
  const titleRef = useRef(title)
  const descriptionRef = useRef(description)
  const baselineRef = useRef({ title: task.title, description: task.description ?? '' })
  const updateRef = useRef(updateTask)
  const flight = useRef<Promise<boolean> | null>(null)
  const flushRef = useRef<() => Promise<boolean>>(async () => true)
  const mounted = useRef(true)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    titleRef.current = title
    descriptionRef.current = description
    updateRef.current = updateTask
  })

  function remember(key: string | null, value: string, baseline: string) {
    if (!key) return
    if (value.trim() === baseline) useDraftStore.getState().clearDraft(key)
    else useDraftStore.getState().setDraft(key, value)
  }

  const flush = useCallback(async () => {
    if (flight.current) {
      await flight.current
      return flushRef.current()
    }

    const nextTitle = titleRef.current.trim()
    const nextDescription = descriptionRef.current.trim()
    const baseline = baselineRef.current
    const patch: TaskPatch = {}
    if (nextTitle && nextTitle !== baseline.title) patch.title = nextTitle
    if (nextDescription !== baseline.description) patch.description = nextDescription
    if (Object.keys(patch).length === 0) return true

    const previous = baseline
    const sent = {
      title: patch.title ?? baseline.title,
      description: patch.description ?? baseline.description,
    }
    baselineRef.current = sent
    if (mounted.current) setSaveState('saving')

    const run = updateRef.current(task.id, patch, { toast: 'saved' }).then((ok) => {
      if (ok) {
        if (titleKey && titleRef.current.trim() === sent.title) useDraftStore.getState().clearDraft(titleKey)
        if (descriptionKey && descriptionRef.current.trim() === sent.description) {
          useDraftStore.getState().clearDraft(descriptionKey)
        }
        if (mounted.current) setSaveState('saved')
        return true
      }
      baselineRef.current = previous
      if (mounted.current) setSaveState('error')
      return false
    })
    flight.current = run
    try {
      return await run
    } finally {
      if (flight.current === run) flight.current = null
    }
  }, [descriptionKey, task.id, titleKey])

  useEffect(() => {
    const nextTitle = title.trim()
    const nextDescription = description.trim()
    const dirty =
      (nextTitle.length > 0 && nextTitle !== baselineRef.current.title) ||
      nextDescription !== baselineRef.current.description
    if (!dirty) return
    const timer = window.setTimeout(() => {
      void flush()
    }, AUTOSAVE_MS)
    return () => window.clearTimeout(timer)
  }, [title, description, flush])

  useEffect(() => {
    flushRef.current = flush
  })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      void flush()
    }
  }, [flush])

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true })
  }, [])

  const progress = subtaskProgress(subtasks)

  return (
    <motion.aside
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-label={t('details.aria', { title: task.title })}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="glass safe-bottom fixed inset-x-0 bottom-0 top-14 z-50 overflow-y-auto rounded-t-3xl p-5 outline-none md:inset-y-3 md:left-auto md:right-3 md:top-3 md:w-[400px] md:rounded-3xl"
    >
      <header className="mb-5 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
          {saveState === 'saving'
            ? t('details.saving')
            : saveState === 'saved'
              ? t('details.saved')
              : saveState === 'error'
                ? t('error.saveTask')
                : t('details.eyebrow')}
        </p>
        <IconButton label={t('details.close')} onClick={() => selectTask(null)} className="-mr-2">
          <X className="h-4 w-4" />
        </IconButton>
      </header>

      <Field label={t('details.title')}>
        {(id) => (
          <Input
            id={id}
            data-field="title"
            value={title}
            onChange={(event) => {
              titleRef.current = event.target.value
              remember(titleKey, event.target.value, baselineRef.current.title)
            }}
            onBlur={() => {
              if (titleRef.current.trim()) return
              titleRef.current = baselineRef.current.title
              if (titleKey) useDraftStore.getState().clearDraft(titleKey)
            }}
          />
        )}
      </Field>

      <div className="mt-4">
        <Field label={t('details.notes')}>
          {(id) => (
            <Textarea
              id={id}
              data-field="description"
              placeholder={t('details.notesPlaceholder')}
              value={description}
              onChange={(event) => {
                descriptionRef.current = event.target.value
                remember(descriptionKey, event.target.value, baselineRef.current.description)
              }}
            />
          )}
        </Field>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label={t('details.status')}>
          {(id) => (
            <Select
              id={id}
              value={task.status}
              onChange={(event) =>
                void updateTask(task.id, { status: event.target.value as Status }, { toast: 'saved' })
              }
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {withMark(STATUS_MARK[status], t(STATUS_KEY[status]))}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('details.priority')}>
          {(id) => (
            <Select
              id={id}
              value={task.priority}
              onChange={(event) =>
                void updateTask(task.id, { priority: event.target.value as Priority }, { toast: 'saved' })
              }
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {withMark(PRIORITY_MARK[priority], t(PRIORITY_KEY[priority]))}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('details.date')}>
          {(id) => (
            <Input
              id={id}
              type="date"
              value={task.dueDate}
              onChange={(event) => {
                if (!event.target.value) return
                void updateTask(task.id, { dueDate: event.target.value }, { toast: 'saved' })
              }}
            />
          )}
        </Field>

        <Field label={t('details.time')}>
          {(id) => (
            <Input
              id={id}
              type="time"
              value={task.dueTime?.slice(0, 5) ?? ''}
              onChange={(event) =>
                void updateTask(task.id, { dueTime: event.target.value || null }, { toast: 'saved' })
              }
            />
          )}
        </Field>

        <Field label={t('details.duration')}>
          {(id) => (
            <Input
              id={id}
              key={task.estimatedMinutes ?? 'none'}
              type="number"
              min={1}
              max={1440}
              inputMode="numeric"
              placeholder={t('details.durationPlaceholder')}
              defaultValue={task.estimatedMinutes ?? ''}
              onBlur={(event) => {
                const value = Number(event.target.value)
                void updateTask(
                  task.id,
                  { estimatedMinutes: event.target.value && value > 0 ? value : null },
                  { toast: 'saved' },
                )
              }}
            />
          )}
        </Field>

        <Field label={t('details.category')}>
          {(id) => (
            <Select
              id={id}
              value={task.categoryId ?? ''}
              onChange={(event) =>
                void updateTask(task.id, { categoryId: event.target.value || null }, { toast: 'saved' })
              }
            >
              <option value="">{t('details.noCategory')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-faint">{t('details.subtasks')}</h3>
          {progress.total > 0 ? (
            <span className="text-[11px] text-faint">
              {progress.done}/{progress.total}
            </span>
          ) : null}
        </div>

        <ul className="mt-2 space-y-1">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="group flex items-center gap-2.5 rounded-xl px-1 py-1">
              <Checkbox
                size="sm"
                checked={subtask.completed}
                label={subtask.title}
                onChange={(value) => void updateSubtask(subtask.id, { completed: value })}
              />
              <SubtaskTitleField
                subtask={subtask}
                label={t('details.subtaskAria', { title: subtask.title })}
                onSave={async (id, title) => updateSubtask(id, { title })}
              />
              <IconButton
                label={t('details.deleteSubtask', { title: subtask.title })}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={() => void deleteSubtask(subtask.id)}
              >
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </li>
          ))}
        </ul>

        <form
          className="mt-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!userId || !newSubtask.trim()) return
            void addSubtask(userId, task.id, newSubtask)
            setNewSubtask('')
          }}
        >
          <Input
            aria-label={t('details.newSubtask')}
            placeholder={t('details.addSubtask')}
            value={newSubtask}
            onChange={(event) => setNewSubtask(event.target.value)}
          />
        </form>
      </section>

      <p className="mt-6 text-xs text-faint">
        {t('details.created', { date: formatShortDate(new Date(task.createdAt)) })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isDone(task) ? (
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              void flush().finally(() => navigate(`/focus/${task.id}`))
            }}
          >
            <Timer className="h-4 w-4" />
            {t('details.focus')}
          </Button>
        ) : null}
        <Button variant="subtle" size="sm" onClick={() => void duplicate(task)}>
          <Copy className="h-4 w-4" />
          {t('details.duplicate')}
        </Button>
        <Button variant="danger" size="sm" onClick={() => confirmRemove(task)}>
          <Trash2 className="h-4 w-4" />
          {t('details.delete')}
        </Button>
      </div>
    </motion.aside>
  )
}
