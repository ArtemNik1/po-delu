import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Keeps Tab inside `container` and restores focus to the opener on close. */
export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>): void {
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function remember(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return
      if (target.closest('[role="dialog"]')) return
      const control = target.closest('button, a[href], input, select, textarea, [tabindex]')
      opener.current = control instanceof HTMLElement ? control : target
    }
    function onFocusIn(event: FocusEvent) {
      remember(event.target)
    }
    function onPointerDown(event: PointerEvent) {
      remember(event.target)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const root = containerRef.current
    if (!root) return

    const items = () =>
      [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => element.tabIndex !== -1)

    const preferred =
      root.querySelector<HTMLElement>('input, textarea, select, [data-autofocus]') ?? items()[0] ?? root
    preferred.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return
      const list = items()
      if (list.length === 0) {
        event.preventDefault()
        root?.focus()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      const current = document.activeElement
      if (event.shiftKey && (current === first || !root?.contains(current))) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      opener.current?.focus()
    }
  }, [active, containerRef])
}
