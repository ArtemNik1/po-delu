// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { useEscapeToClose } from './useEscapeToClose'

function Probe() {
  useEscapeToClose()
  const location = useLocation()
  return (
    <div>
      <span>{location.pathname}</span>
      <input aria-label="notes" />
    </div>
  )
}

beforeEach(() => {
  useUiStore.setState({
    quickAddOpen: false,
    searchOpen: false,
    confirm: null,
    selectedTaskId: null,
  })
})

afterEach(() => {
  cleanup()
})

describe('overlay keyboard', () => {
  it('does not navigate or open overlays from the removed shortcuts', () => {
    render(
      <MemoryRouter initialEntries={['/upcoming']}>
        <Probe />
      </MemoryRouter>,
    )

    for (const key of ['q', 't', 'u', 'i', '/']) {
      fireEvent.keyDown(window, { key })
    }
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    fireEvent.keyDown(screen.getByLabelText('notes'), { key: 'q' })

    expect(screen.getByText('/upcoming')).toBeTruthy()
    expect(useUiStore.getState().quickAddOpen).toBe(false)
    expect(useUiStore.getState().searchOpen).toBe(false)
  })

  it('still closes the topmost overlay with Escape', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Probe />
      </MemoryRouter>,
    )
    useUiStore.setState({
      quickAddOpen: true,
      confirm: {
        title: 'Delete',
        description: 'Remove it',
        confirmLabel: 'Delete',
        onConfirm: () => undefined,
      },
    })

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useUiStore.getState().confirm).toBeNull()
    expect(useUiStore.getState().quickAddOpen).toBe(true)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useUiStore.getState().quickAddOpen).toBe(false)
  })
})
