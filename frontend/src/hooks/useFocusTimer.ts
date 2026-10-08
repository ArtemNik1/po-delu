import { useCallback, useEffect, useState } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

interface Session {
  taskId: string
  durationMinutes: number
  running: boolean
  /** Epoch ms when a running timer reaches zero. */
  endsAt: number | null
  /** Seconds left while idle or paused. */
  remaining: number
  /** True after the user pauses, even if a full second has not elapsed. */
  paused: boolean
}

const KEY = 'po-delu.focus.session'
const TICK_MS = 250

function read(taskId: string): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    return parsed.taskId === taskId ? parsed : null
  } catch {
    return null
  }
}

function write(value: Session | null): void {
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value))
    else sessionStorage.removeItem(KEY)
  } catch {
    // Session persistence is a convenience, not a requirement.
  }
}

function secondsLeft(session: Session): number {
  if (!session.running || session.endsAt === null) return Math.max(0, session.remaining)
  return Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000))
}

/**
 * Countdown driven by a wall-clock deadline rather than accumulated ticks, so it
 * stays accurate when the tab is throttled, survives navigation within the
 * session, and can never go negative. Exactly one interval runs at a time and
 * the finished state is derived, never written twice.
 */
export function useFocusTimer(taskId: string, defaultMinutes = 25) {
  const [session, setSession] = useState<Session>(
    () =>
      read(taskId) ?? {
        taskId,
        durationMinutes: defaultMinutes,
        running: false,
        endsAt: null,
        remaining: defaultMinutes * 60,
        paused: false,
      },
  )

  // Bumped by the interval purely to re-render; the value itself is derived.
  const [, setClock] = useState(0)

  const remaining = secondsLeft(session)
  const finished = session.running && remaining === 0
  const status: TimerStatus = finished
    ? 'finished'
    : session.running
      ? 'running'
      : session.paused
        ? 'paused'
        : 'idle'

  useEffect(() => {
    write(session)
  }, [session])

  useEffect(() => {
    if (!session.running || finished) return
    const interval = window.setInterval(() => setClock((value) => value + 1), TICK_MS)
    return () => window.clearInterval(interval)
  }, [session.running, finished])

  const start = useCallback(() => {
    setSession((current) => {
      const seconds = current.remaining > 0 ? current.remaining : current.durationMinutes * 60
      return { ...current, running: true, paused: false, endsAt: Date.now() + seconds * 1000, remaining: seconds }
    })
  }, [])

  const pause = useCallback(() => {
    setSession((current) =>
      current.running
        ? { ...current, running: false, paused: true, endsAt: null, remaining: secondsLeft(current) }
        : current,
    )
  }, [])

  const reset = useCallback(() => {
    setSession((current) => ({
      ...current,
      running: false,
      paused: false,
      endsAt: null,
      remaining: current.durationMinutes * 60,
    }))
  }, [])

  const setDuration = useCallback((minutes: number) => {
    const safe = Math.min(240, Math.max(1, Math.round(minutes)))
    setSession((current) => ({
      ...current,
      durationMinutes: safe,
      running: false,
      paused: false,
      endsAt: null,
      remaining: safe * 60,
    }))
  }, [])

  const clear = useCallback(() => write(null), [])

  const total = session.durationMinutes * 60

  return {
    durationMinutes: session.durationMinutes,
    status,
    remaining,
    progress: total > 0 ? 1 - remaining / total : 0,
    start,
    pause,
    reset,
    setDuration,
    clear,
  }
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
