import { useMemo } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { CardSkeleton } from '../components/ui/EmptyState'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { durationLabel, formatLongDate, formatWeekday } from '../utils/dates'
import { todayIso } from '../utils/isoDate'
import { BAR_TRACK_PX, barHeightPx, computeAnalytics, type DayPoint } from '../utils/analytics'

export function AnalyticsPage() {
  const { t } = useTranslation()
  const tasks = useDataStore((state) => state.tasks)
  const loading = useDataStore((state) => state.loading)
  const dailyGoal = useAuthStore((state) => state.settings?.daily_goal ?? 5)
  const today = todayIso()

  const summary = useMemo(() => computeAnalytics(tasks, dailyGoal, today), [tasks, dailyGoal, today])

  if (loading && tasks.length === 0) {
    return (
      <div className="page-enter mx-auto max-w-4xl">
        <PageHeader eyebrow={t('analytics.eyebrow')} title={t('analytics.title')} showTools={false} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} className="h-28" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter mx-auto max-w-4xl">
      <PageHeader eyebrow={t('analytics.eyebrow')} title={t('analytics.title')} showTools={false} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={t('analytics.completedToday')}
          value={summary.completedToday}
          note={t('analytics.goalNote', { goal: dailyGoal })}
        />
        <Stat
          label={t('analytics.thisWeek')}
          value={summary.completedThisWeek}
          note={t('analytics.last7Days')}
        />
        <Stat
          label={t('analytics.completionRate')}
          value={`${Math.round(summary.completionRate * 100)}%`}
          note={t('analytics.ofScheduled')}
        />
        <Stat
          label={t('analytics.averagePerDay')}
          value={summary.averagePerDay.toFixed(1)}
          note={t('analytics.last7Days')}
        />
        <Stat
          label={t('analytics.currentStreak')}
          value={summary.streaks.current}
          note={t('analytics.daysAtGoal')}
        />
        <Stat
          label={t('analytics.bestStreak')}
          value={summary.streaks.best}
          note={t('analytics.allTime')}
        />
        <Stat
          label={t('analytics.estimatedFocus')}
          value={durationLabel(summary.focusMinutes ?? 0) ?? ''}
          note={t('analytics.completedThisWeek')}
        />
        <Stat
          label={t('analytics.overdue')}
          value={summary.overdueCount}
          note={t('analytics.overdueNote')}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-line bg-elevated/40 p-5">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">{t('analytics.chartTitle')}</h2>
          <BarChart points={summary.last7Days} goal={dailyGoal} ariaLabel={t('analytics.chartAria')} />
        </section>

        <section className="rounded-3xl border border-line bg-elevated/40 p-5">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">{t('analytics.scoreTitle')}</h2>
          <p className="mt-5 font-serif text-6xl leading-none">{summary.score}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700"
              style={{ width: `${summary.score}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">{t('analytics.scoreExplanation')}</p>
        </section>
      </div>

      <section className="mt-4 rounded-3xl border border-line bg-elevated/40 p-5">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">{t('analytics.heatmapTitle')}</h2>
        <Heatmap points={summary.heatmap} />
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  note,
}: {
  label: string
  value: string | number
  note?: string
}) {
  return (
    <div className="rounded-3xl border border-line bg-elevated/40 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-faint">{label}</p>
      <p className="mt-3 font-serif text-3xl leading-none">{value}</p>
      {note ? <p className="mt-2 text-[11px] text-faint">{note}</p> : null}
    </div>
  )
}

function BarChart({
  points,
  goal,
  ariaLabel,
}: {
  points: DayPoint[]
  goal: number
  ariaLabel: string
}) {
  const max = Math.max(goal, ...points.map((point) => point.value), 1)

  return (
    <div className="mt-6 flex items-end gap-2.5" role="img" aria-label={ariaLabel}>
      {points.map((point) => {
        const reached = point.value >= goal
        return (
          <div key={point.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className={`text-[10px] ${reached ? 'font-semibold text-ink' : 'text-faint'}`}>
              {point.value}
            </span>
            <div className="flex w-full items-end" style={{ height: BAR_TRACK_PX }}>
              <div
                title={`${point.day}: ${point.value}/${goal}`}
                className={`w-full rounded-lg transition-[height] duration-500 ${
                  reached ? 'bg-accent' : 'border-2 border-accent bg-transparent'
                }`}
                style={{ height: barHeightPx(point.value, max) }}
              />
            </div>
            <span className="text-[10px] text-faint">{formatWeekday(point.day)}</span>
          </div>
        )
      })}
    </div>
  )
}

function Heatmap({ points }: { points: DayPoint[] }) {
  const { t } = useTranslation()
  return (
    <div className="no-scrollbar mt-4 overflow-x-auto">
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {points.map((point) => (
          <div
            key={point.day}
            title={t('analytics.heatmapDay', { date: formatLongDate(point.day), count: point.value })}
            className="grid h-5 w-5 place-items-center rounded-[3px] border text-[9px] font-medium leading-none text-ink"
            style={{
              borderColor: point.value === 0 ? 'var(--line)' : 'var(--accent)',
              background: point.value === 0 ? 'transparent' : 'var(--accent-soft)',
            }}
          >
            {point.value > 0 ? (point.value > 9 ? '9+' : point.value) : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
