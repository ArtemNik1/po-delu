import { create } from 'zustand'

export type ToastKind = 'info' | 'success' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  title: string
  description?: string
  kind: ToastKind
  action?: ToastAction
}

export interface ToastInput extends Omit<ToastItem, 'id'> {
  id?: string
  durationMs?: number
}

interface ToastState {
  toasts: ToastItem[]
  push: (input: ToastInput) => string
  dismiss: (id: string) => void
  clear: () => void
}

const MAX_VISIBLE = 3
const timers = new Map<string, number>()

function clearTimer(id: string): void {
  const timer = timers.get(id)
  if (timer !== undefined) window.clearTimeout(timer)
  timers.delete(id)
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: ({ id: providedId, durationMs, ...toast }) => {
    const id = providedId ?? crypto.randomUUID()
    clearTimer(id)

    set((state) => ({
      toasts: [...state.toasts.filter((item) => item.id !== id), { ...toast, id }].slice(-MAX_VISIBLE),
    }))

    // Undo actions need more reading time than plain notices.
    const lifetime = durationMs ?? (toast.action ? 7000 : 3400)
    timers.set(
      id,
      window.setTimeout(() => get().dismiss(id), lifetime),
    )
    return id
  },

  dismiss: (id) => {
    clearTimer(id)
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
  },

  clear: () => {
    for (const id of timers.keys()) clearTimer(id)
    set({ toasts: [] })
  },
}))

export function toast(input: ToastInput): string {
  return useToastStore.getState().push(input)
}
