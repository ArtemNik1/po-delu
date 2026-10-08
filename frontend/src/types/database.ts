import type { Language } from '../lib/i18n'

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = TaskPriority
export type Status = TaskStatus
export type ThemePreference = 'dark' | 'light' | 'colorblind'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  theme: ThemePreference
  /** `null` means "follow the browser preference". */
  language: Language | null
  week_starts_on: 0 | 1
  daily_goal: number
  sound_enabled: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  userId: string
  dueTime: string | null
  estimatedMinutes: number | null
  categoryId: string | null
  sortOrder: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Subtask {
  id: string
  task_id: string
  user_id: string
  title: string
  completed: boolean
  sort_order: number
  created_at: string
}

export interface TaskInsert {
  title: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  dueDate: string
  dueTime?: string | null
  estimatedMinutes?: number | null
  categoryId?: string | null
  sortOrder?: number
}

export interface TaskPatch {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  dueDate?: string
  dueTime?: string | null
  estimatedMinutes?: number | null
  categoryId?: string | null
  sortOrder?: number
}
