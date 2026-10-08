import { motion } from 'framer-motion'
import { Check, Pause, Play, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { formatCountdown, useFocusTimer } from '../hooks/useFocusTimer'
import { useTaskActions } from '../hooks/useTaskActions'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/cn'
import { FOCUS_PRESETS } from '../lib/constants'
import { useDataStore } from '../store/dataStore'
import { toast } from '../store/toastStore'
import { useUiStore } from '../store/uiStore'
import { durationLabel } from '../utils/dates'

export function FocusPage() {
  const { taskId = '' } = useParams()
  const task = useDataStore((state) => state.tasks.find((item) => item.id === taskId) ?? null)
  const bootstrapped = useDataStore((state) => state.bootstrapped)
  const updateTask = useDataStore((state) => state.updateTask)
  const requestConfirm = useUiStore((state) => state.requestConfirm)
  const { setCompleted } = useTaskActions()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const timer = useFocusTimer(taskId, task?.estimatedMinutes ?? 25)
  const clearSession = useRef(timer.clear)
  const [customOpen, setCustomOpen] = useState(false)
  const promptedRef = useRef(false)
  const finishingRef = useRef(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    clearSession.current = timer.clear
  }, [timer.clear])

  const finishTask = useCallback(async (): Promise<boolean> => {
    if (finishingRef.current) return false
    finishingRef.current = true
    setFinishing(true)
    const current = useDataStore.getState().tasks.find((item) => item.id === taskId)
    if (!current) {
      finishingRef.current = false
      setFinishing(false)
      return false
    }
    const ok = await setCompleted(current, true)
    if (!ok) {
      finishingRef.current = false
      setFinishing(false)
      return false
    }
    clearSession.current()
    toast({ kind: 'success', title: t('toast.taskCompleted'), description: current.title })
    navigate('/')
    return true
  }, [navigate, setCompleted, t, taskId])

  const markedRef = useRef(false)
  useEffect(() => {
    if (!task || markedRef.current) return
    markedRef.current = true
    if (task.status === 'todo') {
      void updateTask(task.id, { status: 'in_progress' })
    }
  }, [task, updateTask])

  useEffect(() => {
    if (timer.status !== 'finished' || promptedRef.current || !task) return
    promptedRef.current = true
    requestConfirm({
      title: t('focus.completeTitle'),
      description: t('focus.completeDescription', { title: task.title }),
      confirmLabel: t('focus.completeConfirm'),
      onConfirm: () => finishTask(),
    })
  }, [timer.status, task, requestConfirm, finishTask, t])

  useEffect(() => {
    if (timer.status !== 'finished') promptedRef.current = false
  }, [timer.status])

  if (!task) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="font-serif text-3xl">
            {bootstrapped ? t('focus.missing') : t('focus.loading')}
          </p>
          {bootstrapped ? (
            <Button className="mt-6" variant="subtle" onClick={() => navigate('/')}>
              {t('focus.backToToday')}
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  const running = timer.status === 'running'
  const statusLabel =
    timer.status === 'idle'
      ? t('focus.idle')
      : timer.status === 'running'
        ? t('focus.running')
        : timer.status === 'paused'
          ? t('focus.paused')
          : t('focus.finished')

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <button
        type="button"
        onClick={() => {
          timer.clear()
          navigate(-1)
        }}
        aria-label={t('focus.exit')}
        className="absolute right-5 top-5 rounded-xl p-2 text-faint transition hover:text-ink"
      >
        <X className="h-5 w-5" />
      </button>

      <p className="text-[11px] uppercase tracking-[0.24em] text-faint">{t('focus.eyebrow')}</p>
      <h1 className="mt-4 max-w-xl font-serif text-3xl leading-tight md:text-5xl">{task.title}</h1>
      {task.estimatedMinutes ? (
        <p className="mt-2 text-xs text-faint">
          {t('focus.estimated', { duration: durationLabel(task.estimatedMinutes) ?? '' })}
        </p>
      ) : null}

      <div className="relative mt-12 grid place-items-center">
        <Ring progress={timer.progress} active={running} />
        <motion.p
          key={timer.status}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className="absolute font-serif text-5xl tabular-nums md:text-6xl"
          aria-live="off"
        >
          {formatCountdown(timer.remaining)}
        </motion.p>
      </div>

      <p className="mt-4 text-xs text-muted" role="status">
        {statusLabel}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {FOCUS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={timer.durationMinutes === preset && !customOpen}
            onClick={() => {
              setCustomOpen(false)
              timer.setDuration(preset)
            }}
            className={cn(
              'rounded-full border px-4 py-2 text-sm transition',
              timer.durationMinutes === preset && !customOpen
                ? 'border-accent/50 bg-accent-soft text-ink'
                : 'border-line text-muted hover:text-ink',
            )}
          >
            {t('focus.minutes', { count: preset })}
          </button>
        ))}
        {customOpen ? (
          <Input
            autoFocus
            type="number"
            min={1}
            max={240}
            inputMode="numeric"
            aria-label={t('focus.customAria')}
            className="h-10 w-24 rounded-full text-center"
            defaultValue={timer.durationMinutes}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (value >= 1 && value <= 240) timer.setDuration(value)
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="rounded-full border border-line px-4 py-2 text-sm text-muted transition hover:text-ink"
          >
            {t('focus.custom')}
          </button>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={running ? timer.pause : timer.start}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {timer.status === 'paused' ? t('focus.resume') : running ? t('focus.pause') : t('focus.start')}
        </Button>
        <Button size="lg" variant="subtle" onClick={timer.reset} disabled={timer.status === 'idle'}>
          <RotateCcw className="h-4 w-4" />
          {t('focus.reset')}
        </Button>
        <Button
          size="lg"
          variant="subtle"
          loading={finishing}
          onClick={() => {
            void finishTask()
          }}
        >
          <Check className="h-4 w-4" />
          {t('focus.finish')}
        </Button>
      </div>
    </div>
  )
}

function Ring({ progress, active }: { progress: number; active: boolean }) {
  const size = 260
  const stroke = 2
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="max-w-[70vw]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--line)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: 'stroke-dashoffset 300ms linear',
          filter: active ? 'drop-shadow(0 0 8px var(--glow))' : undefined,
        }}
      />
    </svg>
  )
}
