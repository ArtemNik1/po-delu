// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { applyDateLocale } from '../lib/locale'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import type { UserSettings } from '../types/database'
import { UpcomingPage } from './UpcomingPage'

function settings(language: UserSettings['language']): UserSettings {
  const now = '2026-10-05T00:00:00.000Z'
  return {
    user_id: 'user-1',
    theme: 'dark',
    language,
    week_starts_on: 1,
    daily_goal: 5,
    sound_enabled: true,
    onboarding_completed: true,
    created_at: now,
    updated_at: now,
  }
}

function show(language: UserSettings['language']) {
  act(() => {
    applyDateLocale(language ?? 'ru')
    useAuthStore.setState((state) => ({
      settings: settings(language),
      localeEpoch: state.localeEpoch + 1,
    }))
  })
}

function weekdayLabels(): string[] {
  const row = document.querySelector('.uppercase.grid')
  return [...(row?.querySelectorAll('span') ?? [])].map((item) => item.textContent ?? '')
}

beforeEach(() => {
  useDataStore.getState().reset()
  useDataStore.setState({ bootstrapped: true, loading: false })
  show('ru')
})

afterEach(() => {
  cleanup()
})

describe('upcoming weekday labels', () => {
  it('updates weekday labels when the language changes without moving the selected day', () => {
    render(
      <MemoryRouter>
        <UpcomingPage />
      </MemoryRouter>,
    )

    const date = document.querySelector('input[type="date"]') as HTMLInputElement
    const selected = date.value
    const month = screen.getAllByRole('heading', { level: 2 }).map((item) => item.textContent)

    expect(weekdayLabels().join(' ')).toMatch(/пн/)
    expect(weekdayLabels().join(' ')).not.toMatch(/Mon/)

    show('en')
    expect(weekdayLabels()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(date.value).toBe(selected)

    show('ru')
    expect(weekdayLabels().join(' ')).toMatch(/пн/)
    expect(weekdayLabels().join(' ')).not.toMatch(/Mon/)
    expect(date.value).toBe(selected)
    expect(screen.getAllByRole('heading', { level: 2 })[0]?.textContent).toContain('2026')
    expect(month[0]).toContain('2026')
  })
})
