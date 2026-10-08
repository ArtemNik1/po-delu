// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFocusTimer } from './useFocusTimer'

describe('useFocusTimer pause in the first second', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-02T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.clear()
  })

  it('pauses immediately and resumes the same countdown', () => {
    const { result } = renderHook(() => useFocusTimer('task-1', 25))

    act(() => result.current.start())
    expect(result.current.status).toBe('running')
    expect(result.current.remaining).toBe(25 * 60)

    act(() => result.current.pause())
    expect(result.current.status).toBe('paused')
    expect(result.current.remaining).toBe(25 * 60)

    act(() => result.current.start())
    expect(result.current.status).toBe('running')

    vi.setSystemTime(new Date('2026-10-02T12:00:02.000Z'))
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(result.current.status).toBe('running')
    expect(result.current.remaining).toBe(25 * 60 - 2)
  })
})
