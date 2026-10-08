import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

/** Escape closes the topmost overlay. Other keys are left to the browser. */
export function useEscapeToClose(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      useUiStore.getState().closeOverlays()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
