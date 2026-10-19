import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

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
