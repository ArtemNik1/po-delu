import { create } from 'zustand'

const STORAGE_KEY = 'po-delu.drafts'

export type TaskDraftField = 'title' | 'description'

function readAll(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const drafts: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') drafts[key] = value
    }
    return drafts
  } catch {
    return {}
  }
}

function writeAll(drafts: Record<string, string>): void {
  try {
    if (Object.keys(drafts).length === 0) sessionStorage.removeItem(STORAGE_KEY)
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch {
    // A blocked sessionStorage only drops the retry copy; the open field still has the text.
  }
}

export function taskDraftKey(userId: string, taskId: string, field: TaskDraftField): string {
  return `${userId}:task:${taskId}:${field}`
}

export function subtaskDraftKey(userId: string, subtaskId: string): string {
  return `${userId}:subtask:${subtaskId}:title`
}

interface DraftState {
  drafts: Record<string, string>
  setDraft: (key: string, value: string) => void
  clearDraft: (key: string) => void
  clearPrefix: (prefix: string) => void
  clearUser: (userId: string) => void
}

export const useDraftStore = create<DraftState>((set, get) => {
  function commit(drafts: Record<string, string>): void {
    writeAll(drafts)
    set({ drafts })
  }

  return {
    drafts: readAll(),

    setDraft: (key, value) => {
      if (get().drafts[key] === value) return
      commit({ ...get().drafts, [key]: value })
    },

    clearDraft: (key) => {
      if (!(key in get().drafts)) return
      const drafts = { ...get().drafts }
      delete drafts[key]
      commit(drafts)
    },

    clearPrefix: (prefix) => {
      const drafts = Object.fromEntries(Object.entries(get().drafts).filter(([key]) => !key.startsWith(prefix)))
      commit(drafts)
    },

    clearUser: (userId) => {
      get().clearPrefix(`${userId}:`)
    },
  }
})

export function clearTaskDrafts(userId: string, taskId: string, subtaskIds: string[]): void {
  const drafts = useDraftStore.getState()
  drafts.clearPrefix(`${userId}:task:${taskId}:`)
  for (const id of subtaskIds) drafts.clearDraft(subtaskDraftKey(userId, id))
}
