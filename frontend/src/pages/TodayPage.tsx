import { Flame } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { QuickAdd } from '../components/tasks/QuickAdd'
import { TaskList } from '../components/tasks/TaskList'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Field'
import { EmptyState, TaskSkeleton } from '../components/ui/EmptyState'
import { useVisibleTasks } from '../hooks/useTasks'
import { useTaskActions } from '../hooks/useTaskActions'
import { useTranslation } from '../hooks/useTranslation'
import { STATUS_MARK, withMark } from '../lib/constants'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import type { Task } from '../types/database'
import type { StatusFilter } from '../store/dataStore'
import { firstName, formatLongDate, greetingKey } from '../utils/dates'
import { todayIso } from '../utils/isoDate'
import { completedByDay, isDone, isOverdue, todayProgress } from '../utils/tasks'
import { computeStreaks } from '../utils/productivity'

export function TodayPage() {
  const today = todayIso()
  const profile = useAuthStore((state) => state.profile)
  const email = useAuthStore((state) => state.user?.email ?? null)
  const dailyGoal = useAuthStore((state) => state.settings?.daily_goal ?? 5)
  const allTasks = useDataStore((state) => state.tasks)
  const filteredTasks = useDataStore((state) => state.filteredTasks)
  const statusFilter = useDataStore((state) => state.statusFilter)
  const listLoading = useDataStore((state) => state.listLoading)
  const setStatusFilter = useDataStore((state) => state.setStatusFilter)
  const loading = useDataStore((state) => state.loading)
  const { scheduleFor } = useTaskActions()
  const { t } = useTranslation()

  const progress = useMemo(() => todayProgress(allTasks, today), [allTasks, today])
  const dueToday = useCallback((tasks: Task[]) => tasks.filter((task) => task.dueDate === today), [today])
  const dueTodayFiltered = useCallback(
    () => filteredTasks.filter((task) => task.dueDate === today),
    [filteredTasks, today],
  )
  const allVisible = useVisibleTasks(dueToday)
  const filteredVisible = useVisibleTasks(dueTodayFiltered)

  const listed = statusFilter === 'all' ? allVisible : filteredVisible
  const active = listed.filter((task) => !isDone(task))
  const done = listed.filter((task) => isDone(task))

  const overdue = useMemo(
    () =>
      allTasks
        .filter((task) => isOverdue(task, today))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [allTasks, today],
  )

  const streak = useMemo(
    () => computeStreaks(completedByDay(allTasks), dailyGoal, today).current,
    [allTasks, dailyGoal, today],
  )

  const name = firstName(profile?.display_name, email)

  return (
    <div className="page-enter mx-auto max-w-3xl">
      <PageHeader
        eyebrow={formatLongDate(new Date())}
        title={
          <>
            {t(greetingKey())}, {name}
          </>
        }
      />

      <section aria-label={t('today.glance')} className="mb-8 grid gap-3 sm:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-line bg-elevated/45 p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-faint">{t('today.focus')}</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="font-serif text-4xl leading-none">
              {progress.done}
              <span className="mx-1.5 text-faint">/</span>
              {progress.total}
              <span className="ml-2 align-middle text-sm font-sans text-muted">
                {t('today.completedWord')}
              </span>
            </p>
            <p className="text-sm text-muted">{progress.percent}%</p>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('today.progressAria')}
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/8"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-elevated/45 p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-faint">{t('today.streak')}</p>
          <p className="mt-4 flex items-baseline gap-2 font-serif text-4xl leading-none">
            {streak > 0 ? <Flame className="h-6 w-6 text-high" aria-hidden /> : null}
            {streak}
          </p>
          <p className="mt-2 text-sm leading-5 text-muted">
            {streak > 0
              ? t('today.streakCaption', { count: streak, goal: dailyGoal })
              : t('today.streakEmpty', { count: dailyGoal })}
          </p>
        </div>
      </section>

      <div className="mb-4">
        <Segmented<StatusFilter>
          label={t('list.filter')}
          value={statusFilter}
          onChange={(value) => void setStatusFilter(value)}
          options={[
            { value: 'all', label: t('list.all') },
            { value: 'todo', label: withMark(STATUS_MARK.todo, t('list.todo')) },
            { value: 'in_progress', label: withMark(STATUS_MARK.in_progress, t('list.in_progress')) },
            { value: 'done', label: withMark(STATUS_MARK.done, t('list.done')) },
          ]}
        />
      </div>

      <QuickAdd defaultDate={today} />

      {statusFilter === 'all' && overdue.length > 0 ? (
        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-high">
          <p>
            <span aria-hidden>! </span>
            {t('today.overdue', { count: overdue.length })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              for (const task of overdue) void scheduleFor(task, today)
            }}
          >
            {t('today.moveAllToToday')}
          </Button>
        </div>
      ) : null}

      <div className="mt-8">
        {(statusFilter !== 'all' ? listLoading : loading) && listed.length === 0 ? (
          <TaskSkeleton />
        ) : listed.length === 0 ? (
          <EmptyState title={t('today.emptyTitle')} description={t('today.emptyDescription')} />
        ) : statusFilter === 'all' ? (
          <>
            {active.length > 0 ? (
              <TaskList tasks={active} reorderable ariaLabel={t('today.tasksAria')} />
            ) : (
              <EmptyState
                title={t('today.allDoneTitle')}
                description={t('today.allDoneDescription')}
              />
            )}

            {done.length > 0 ? (
              <section className="mt-8">
                <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-faint">
                  {t('today.completedSection', { count: done.length })}
                </h2>
                <TaskList tasks={done} ariaLabel={t('today.completedAria')} />
              </section>
            ) : null}
          </>
        ) : (
          <TaskList tasks={listed} ariaLabel={t('list.filter')} />
        )}
      </div>
    </div>
  )
}
