import { create } from 'zustand'
import { EMPTY_FILTER, type TaskFilter } from '../types/filters'

export interface ConfirmRequest {
  title: string
  description: string
  confirmLabel: string
  tone?: 'danger' | 'default'

  onConfirm: () => void | boolean | Promise<void | boolean>
}

export interface ReschedulePrompt {
  taskId: string
  title: string
  fromDate: string | null
  toDate: string | null
  overdue: boolean
}

interface UiState {
  sidebarCollapsed: boolean
  quickAddOpen: boolean
  filtersOpen: boolean
  searchOpen: boolean
  searchQuery: string
  selectedTaskId: string | null
  categoryModalOpen: boolean
  confirm: ConfirmRequest | null
  reschedulePrompt: ReschedulePrompt | null
  filters: TaskFilter
  toggleSidebar: () => void
  setQuickAddOpen: (value: boolean) => void
  setFiltersOpen: (value: boolean) => void
  openSearch: () => void
  closeSearch: () => void
  setSearchQuery: (value: string) => void
  selectTask: (id: string | null) => void
  setCategoryModalOpen: (value: boolean) => void
  requestConfirm: (request: ConfirmRequest) => void
  closeConfirm: () => void
  requestReschedule: (prompt: ReschedulePrompt) => void
  closeReschedule: () => void
  setFilters: (value: TaskFilter) => void
  resetFilters: () => void
  closeOverlays: () => void
}

const SIDEBAR_KEY = 'po-delu.sidebar.collapsed'

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {

  }
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: readFlag(SIDEBAR_KEY),
  quickAddOpen: false,
  filtersOpen: false,
  searchOpen: false,
  searchQuery: '',
  selectedTaskId: null,
  categoryModalOpen: false,
  confirm: null,
  reschedulePrompt: null,
  filters: EMPTY_FILTER,

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed
    writeFlag(SIDEBAR_KEY, next)
    set({ sidebarCollapsed: next })
  },
  setQuickAddOpen: (value) => set({ quickAddOpen: value }),
  setFiltersOpen: (value) => set({ filtersOpen: value }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false, searchQuery: '' }),
  setSearchQuery: (value) => set({ searchQuery: value }),
  selectTask: (id) => set({ selectedTaskId: id }),
  setCategoryModalOpen: (value) => set({ categoryModalOpen: value }),
  requestConfirm: (request) => set({ confirm: request }),
  closeConfirm: () => set({ confirm: null }),
  requestReschedule: (prompt) => set({ reschedulePrompt: prompt }),
  closeReschedule: () => set({ reschedulePrompt: null }),
  setFilters: (value) => set({ filters: value }),
  resetFilters: () => set({ filters: EMPTY_FILTER }),

  closeOverlays: () => {
    const state = get()
    if (state.confirm) return set({ confirm: null })
    if (state.reschedulePrompt) return set({ reschedulePrompt: null })
    if (state.categoryModalOpen) return set({ categoryModalOpen: false })
    if (state.selectedTaskId) return set({ selectedTaskId: null })
    if (state.filtersOpen) return set({ filtersOpen: false })
    if (state.searchOpen) return set({ searchOpen: false, searchQuery: '' })
    if (state.quickAddOpen) return set({ quickAddOpen: false })
    return undefined
  },
}))

const QUICK_ADD_PATHS = new Set(['/', '/upcoming', '/inbox'])

export function openQuickAdd(pathname: string, navigate: (path: string) => void): void {
  useUiStore.getState().setQuickAddOpen(true)
  if (!QUICK_ADD_PATHS.has(pathname)) navigate('/')
}
