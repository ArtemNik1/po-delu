import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Briefcase,
  Code,
  Coffee,
  Dumbbell,
  Heart,
  House,
  Music,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  User,
} from 'lucide-react'
import type { Priority, Status } from '../types/database'
import type { TranslationKey } from './i18n'

export const APP_NAME = 'По делу'

/** Fixed icon set — users pick from these rather than uploading artwork. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  briefcase: Briefcase,
  book: BookOpen,
  user: User,
  heart: Heart,
  house: House,
  dumbbell: Dumbbell,
  code: Code,
  shopping: ShoppingBag,
  plane: Plane,
  music: Music,
  target: Target,
  coffee: Coffee,
  star: Star,
}

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS)
export const DEFAULT_CATEGORY_ICON = 'sparkles'

export function categoryIcon(key: string | undefined): LucideIcon {
  return (key ? CATEGORY_ICONS[key] : undefined) ?? Sparkles
}

export const PRIORITY_KEY: Record<Priority, TranslationKey> = {
  low: 'priority.low',
  medium: 'priority.medium',
  high: 'priority.high',
}

export const PRIORITY_SHORT: Record<Priority, TranslationKey> = {
  low: 'priority.short.low',
  medium: 'priority.short.medium',
  high: 'priority.short.high',
}

/** Shape cue so priority is readable without colour. */
export const PRIORITY_MARK: Record<Priority, string> = {
  low: '↓',
  medium: '→',
  high: '↑',
}

export const PRIORITIES = Object.keys(PRIORITY_KEY) as Priority[]

export const STATUS_KEY: Record<Status, TranslationKey> = {
  todo: 'status.todo',
  in_progress: 'status.in_progress',
  done: 'status.done',
}

export const STATUSES = Object.keys(STATUS_KEY) as Status[]

/** Shape cue so status is readable without colour. */
export const STATUS_MARK: Record<Status, string> = {
  todo: '○',
  in_progress: '◐',
  done: '✓',
}

export function withMark(mark: string, label: string): string {
  return `${mark} ${label}`
}

export const FOCUS_PRESETS = [25, 50] as const
export const DAILY_GOAL_PRESETS = [3, 5, 8] as const
