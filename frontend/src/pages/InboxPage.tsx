import { useCallback, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { QuickAdd } from '../components/tasks/QuickAdd'
import { TaskRow } from '../components/tasks/TaskRow'
import { Button } from '../components/ui/Button'
import { EmptyState, TaskSkeleton } from '../components/ui/EmptyState'
import { useVisibleTasks } from '../hooks/useTasks'
import { useTaskActions } from '../hooks/useTaskActions'
import { useTranslation } from '../hooks/useTranslation'
import { useDataStore } from '../store/dataStore'
import type { Task } from '../types/database'
import { addDaysIso } from '../utils/dates'
import { todayIso } from '../utils/isoDate'
import { isInboxTask } from '../utils/tasks'

export function InboxPage() {
  const loading = useDataStore((state) => state.loading)
  const { scheduleFor } = useTaskActions()
  const { t } = useTranslation()
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null)

  const selectInbox = useCallback((tasks: Task[]) => tasks.filter(isInboxTask), [])
  const inbox = useVisibleTasks(selectInbox)

  return (
    <div className="page-enter mx-auto max-w-3xl">
      <PageHeader eyebrow={t('inbox.eyebrow')} title={t('inbox.title')} />

      <QuickAdd defaultDate={todayIso()} />

      <div className="mt-6">
        {loading && inbox.length === 0 ? (
          <TaskSkeleton rows={4} />
        ) : inbox.length === 0 ? (
          <EmptyState title={t('inbox.emptyTitle')} description={t('inbox.emptyDescription')} />
        ) : (
          <ul className="space-y-2">
            {inbox.map((task) => (
              <li key={task.id} className="rounded-2xl border border-line/60">
                <ul>
                  <TaskRow task={task} />
                </ul>
                <div className="flex flex-wrap items-center gap-2 border-t border-line/60 px-3 py-2">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-faint">
                    {t('inbox.schedule')}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => void scheduleFor(task, todayIso())}>
                    {t('common.today')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void scheduleFor(task, addDaysIso(1))}>
                    {t('common.tomorrow')}
                  </Button>
                  {datePickerFor === task.id ? (
                    <input
                      type="date"
                      autoFocus
                      aria-label={t('inbox.pickDateFor', { title: task.title })}
                      className="h-8 rounded-lg border border-line bg-elevated/60 px-2 text-xs"
                      onBlur={() => setDatePickerFor(null)}
                      onChange={(event) => {
                        if (!event.target.value) return
                        void scheduleFor(task, event.target.value)
                        setDatePickerFor(null)
                      }}
                    />
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setDatePickerFor(task.id)}>
                      {t('inbox.pickDate')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
