import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { QuickAdd } from '../components/tasks/QuickAdd'
import { TaskList } from '../components/tasks/TaskList'
import { EmptyState, TaskSkeleton } from '../components/ui/EmptyState'
import { useVisibleTasks } from '../hooks/useTasks'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/cn'
import { useDataStore } from '../store/dataStore'
import type { Task } from '../types/database'
import { formatLongDate, formatMonthYear, formatWeekday } from '../utils/dates'
import { addIsoDays, monthGrid, sameMonth, shiftMonth, todayIso } from '../utils/isoDate'

const WEEK_START = '2026-01-05'

export function UpcomingPage() {
  const loading = useDataStore((state) => state.loading)
  const statusFilter = useDataStore((state) => state.statusFilter)
  const filteredTasks = useDataStore((state) => state.filteredTasks)
  const { t, language } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(() => addIsoDays(todayIso(), 1))
  const [cursor, setCursor] = useState(selectedDate)

  const source = useCallback(
    (tasks: Task[]) => (statusFilter === 'all' ? tasks : filteredTasks),
    [filteredTasks, statusFilter],
  )
  const visible = useVisibleTasks(source)
  const selectedTasks = visible.filter((task) => task.dueDate === selectedDate)

  const days = useMemo(() => monthGrid(cursor), [cursor])
  const weekdayLabels = useMemo(
    () => Array.from({ length: 7 }, (_, index) => formatWeekday(addIsoDays(WEEK_START, index), language)),
    [language],
  )
  const countsByDay = useMemo(() => {
    const counts = new Map<string, number>()
    for (const task of visible) counts.set(task.dueDate, (counts.get(task.dueDate) ?? 0) + 1)
    return counts
  }, [visible])

  function choose(day: string) {
    setSelectedDate(day)
    setCursor(day)
  }

  return (
    <div className="page-enter mx-auto max-w-3xl">
      <PageHeader eyebrow={t('upcoming.eyebrow')} title={t('upcoming.title')} />

      <section aria-label={t('upcoming.pickDate')} className="mb-5 rounded-3xl border border-line p-3 sm:p-4">
        <div className="mb-3">
          <h2 className="text-center font-serif text-lg capitalize leading-tight sm:text-xl">
            {formatMonthYear(cursor)}
          </h2>
          <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <CalendarButton label={t('upcoming.prevYear')} onClick={() => setCursor((value) => shiftMonth(value, -12))}>
              <ChevronLeft className="h-3.5 w-3.5" />
              <ChevronLeft className="-ml-2 h-3.5 w-3.5" />
            </CalendarButton>
            <CalendarButton label={t('upcoming.prevMonth')} onClick={() => setCursor((value) => shiftMonth(value, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </CalendarButton>
          </div>
          <div className="flex items-center gap-1">
            <CalendarButton label={t('upcoming.nextMonth')} onClick={() => setCursor((value) => shiftMonth(value, 1))}>
              <ChevronRight className="h-4 w-4" />
            </CalendarButton>
            <CalendarButton label={t('upcoming.nextYear')} onClick={() => setCursor((value) => shiftMonth(value, 12))}>
              <ChevronRight className="h-3.5 w-3.5" />
              <ChevronRight className="-ml-2 h-3.5 w-3.5" />
            </CalendarButton>
          </div>
          </div>
        </div>

        <label className="mb-3 flex items-center justify-between gap-3 text-xs text-muted">
          <span>{t('upcoming.jump')}</span>
          <input
            type="date"
            value={selectedDate}
            aria-label={t('upcoming.jump')}
            onChange={(event) => {
              if (event.target.value) choose(event.target.value)
            }}
            className="rounded-xl border border-line bg-transparent px-2 py-1.5 text-sm text-ink"
          />
        </label>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.12em] text-faint">
          {weekdayLabels.map((label) => (
            <span key={label} className="py-1">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const count = countsByDay.get(day) ?? 0
            const selected = day === selectedDate
            const inMonth = sameMonth(day, cursor)
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                aria-label={formatLongDate(day)}
                onClick={() => choose(day)}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center rounded-xl text-sm transition',
                  selected ? 'bg-accent-soft text-ink' : 'hover:bg-ink/5',
                  inMonth ? 'text-ink' : 'text-faint',
                )}
              >
                <span>{Number(day.slice(8, 10))}</span>
                <span className={cn('text-[10px] leading-none', count > 0 ? 'text-accent' : 'text-transparent')}>
                  {count > 0 ? count : '·'}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <QuickAdd key={selectedDate} defaultDate={selectedDate} />

      <section className="mt-6">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-faint">
          {t('upcoming.tasksOn', { date: formatLongDate(selectedDate) })}
          {selectedTasks.length > 0 ? ` · ${selectedTasks.length}` : ''}
        </h2>
        {loading && visible.length === 0 ? (
          <TaskSkeleton rows={4} />
        ) : selectedTasks.length === 0 ? (
          <EmptyState title={t('upcoming.emptyTitle')} description={t('upcoming.emptyDescription')} />
        ) : (
          <TaskList
            tasks={selectedTasks}
            reorderable
            ariaLabel={t('upcoming.tasksOn', { date: formatLongDate(selectedDate) })}
          />
        )}
      </section>
    </div>
  )
}

function CalendarButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl text-muted transition hover:bg-ink/5 hover:text-ink"
    >
      {children}
    </button>
  )
}
