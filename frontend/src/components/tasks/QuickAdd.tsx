import { ChevronDown, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { PRIORITIES, PRIORITY_KEY, PRIORITY_MARK, withMark } from '../../lib/constants'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { Priority } from '../../types/database'
import { todayIso } from '../../utils/isoDate'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'

interface QuickAddProps {
  /** Due date pre-filled for new tasks. New tasks always start as `todo`. */
  defaultDate: string
}

interface Draft {
  title: string
  description: string
  date: string
  time: string
  priority: Priority
  categoryId: string
  minutes: string
}

function emptyDraft(date: string): Draft {
  return {
    title: '',
    description: '',
    date,
    time: '',
    priority: 'medium',
    categoryId: '',
    minutes: '',
  }
}

export function QuickAdd({ defaultDate }: QuickAddProps) {
  const open = useUiStore((state) => state.quickAddOpen)
  const setOpen = useUiStore((state) => state.setQuickAddOpen)
  const categories = useDataStore((state) => state.categories)
  const createTask = useDataStore((state) => state.createTask)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const { t } = useTranslation()

  const [draft, setDraft] = useState<Draft>(() => emptyDraft(defaultDate))
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function close() {
    setOpen(false)
    setExpanded(false)
    setDraft(emptyDraft(defaultDate))
  }

  async function submit() {
    if (!userId || !draft.title.trim() || saving) return
    setSaving(true)
    const created = await createTask(userId, {
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      categoryId: draft.categoryId || null,
      dueTime: draft.time || null,
      estimatedMinutes: draft.minutes ? Number(draft.minutes) : null,
      dueDate: draft.date || defaultDate || todayIso(),
      status: 'todo',
    })
    setSaving(false)
    if (!created) return
    // Stay open so several tasks can be captured in a row.
    setDraft(emptyDraft(defaultDate))
    inputRef.current?.focus()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-14 w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 text-left text-sm text-faint transition hover:border-accent/40 hover:text-muted"
      >
        <Plus className="h-4 w-4 transition group-hover:text-accent" aria-hidden />
        {t('quickAdd.trigger')}
      </button>
    )
  }

  return (
    <form
      className="glass max-w-full rounded-2xl p-3"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <Input
        ref={inputRef}
        aria-label={t('quickAdd.titleLabel')}
        placeholder={t('quickAdd.placeholder')}
        value={draft.title}
        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
      />

      {expanded ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label={t('quickAdd.date')}>
            {(id) => (
              <Input
                id={id}
                type="date"
                value={draft.date}
                onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
              />
            )}
          </Field>
          <Field label={t('quickAdd.time')}>
            {(id) => (
              <Input
                id={id}
                type="time"
                value={draft.time}
                onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
              />
            )}
          </Field>
          <Field label={t('quickAdd.priority')}>
            {(id) => (
              <Select
                id={id}
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, priority: event.target.value as Priority }))
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
          <Field label={t('quickAdd.category')}>
            {(id) => (
              <Select
                id={id}
                value={draft.categoryId}
                onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
              >
                <option value="">{t('quickAdd.noCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('quickAdd.estimated')}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={1440}
                inputMode="numeric"
                placeholder="25"
                value={draft.minutes}
                onChange={(event) => setDraft((current) => ({ ...current, minutes: event.target.value }))}
              />
            )}
          </Field>
          <div className="md:col-span-2">
            <Field label={t('quickAdd.description')}>
              {(id) => (
                <Textarea
                  id={id}
                  className="min-h-20"
                  placeholder={t('quickAdd.descriptionPlaceholder')}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                />
              )}
            </Field>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs text-muted hover:text-ink"
        >
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${expanded ? 'rotate-180' : ''}`} aria-hidden />
          {t('quickAdd.details')}
        </button>
        <Button variant="ghost" size="sm" onClick={close}>
          {t('common.close')}
        </Button>
        <Button type="submit" size="sm" loading={saving} disabled={!draft.title.trim()}>
          {t('quickAdd.submit')}
        </Button>
      </div>
    </form>
  )
}
