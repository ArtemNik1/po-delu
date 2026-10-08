import { RotateCcw } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { TaskList } from '../components/tasks/TaskList'
import { Button } from '../components/ui/Button'
import { EmptyState, TaskSkeleton } from '../components/ui/EmptyState'
import { useVisibleTasks } from '../hooks/useTasks'
import { useTaskActions } from '../hooks/useTaskActions'
import { useTranslation } from '../hooks/useTranslation'
import { useDataStore } from '../store/dataStore'
import type { Task } from '../types/database'
import { todayIso } from '../utils/isoDate'
import { groupCompleted } from '../utils/tasks'

export function CompletedPage() {
  const today = todayIso()
  const loading = useDataStore((state) => state.loading)
  const { setCompleted } = useTaskActions()
  const { t } = useTranslation()

  const selectCompleted = useCallback((tasks: Task[]) => tasks.filter((task) => task.status === 'done'), [])
  const completed = useVisibleTasks(selectCompleted)

  const groups = useMemo(() => groupCompleted(completed, today), [completed, today])

  return (
    <div className="page-enter mx-auto max-w-3xl">
      <PageHeader eyebrow={t('completed.eyebrow')} title={t('completed.title')} />

      {loading && completed.length === 0 ? (
        <TaskSkeleton rows={4} />
      ) : completed.length === 0 ? (
        <EmptyState title={t('completed.emptyTitle')} description={t('completed.emptyDescription')} />
      ) : (
        <div className="space-y-9">
          <Group
            title={t('common.today')}
            tasks={groups.today}
            onRestoreAll={() => groups.today.forEach((task) => void setCompleted(task, false))}
          />
          <Group
            title={t('common.yesterday')}
            tasks={groups.yesterday}
            onRestoreAll={() => groups.yesterday.forEach((task) => void setCompleted(task, false))}
          />
          <Group title={t('common.older')} tasks={groups.older} />
        </div>
      )}
    </div>
  )
}

function Group({
  title,
  tasks,
  onRestoreAll,
}: {
  title: string
  tasks: Task[]
  onRestoreAll?: () => void
}) {
  const { t } = useTranslation()
  if (tasks.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">
          {title} · {tasks.length}
        </h2>
        {onRestoreAll && tasks.length > 1 ? (
          <Button variant="ghost" size="sm" onClick={onRestoreAll}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {t('completed.restoreAll')}
          </Button>
        ) : null}
      </div>
      <TaskList tasks={tasks} showDate ariaLabel={t('completed.groupAria', { title })} />
    </section>
  )
}
