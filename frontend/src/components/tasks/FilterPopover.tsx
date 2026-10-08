import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'
import {
  PRIORITIES,
  PRIORITY_KEY,
  PRIORITY_MARK,
  STATUSES,
  STATUS_KEY,
  STATUS_MARK,
  withMark,
} from '../../lib/constants'
import type { TranslationKey } from '../../lib/i18n'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import { countActiveFilters, type CompletionFilter } from '../../types/filters'
import { Button } from '../ui/Button'

const COMPLETION: { value: CompletionFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'active', labelKey: 'common.active' },
  { value: 'completed', labelKey: 'common.completed' },
]

export function FilterPopover() {
  const open = useUiStore((state) => state.filtersOpen)
  const setOpen = useUiStore((state) => state.setFiltersOpen)
  const filters = useUiStore((state) => state.filters)
  const setFilters = useUiStore((state) => state.setFilters)
  const resetFilters = useUiStore((state) => state.resetFilters)
  const categories = useDataStore((state) => state.categories)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, setOpen])

  const active = countActiveFilters(filters)

  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="subtle"
        size="sm"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        {t('filters.button')}
        {active > 0 ? (
          <span className="ml-0.5 rounded-full bg-accent-soft px-1.5 text-[10px] text-accent">{active}</span>
        ) : null}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label={t('filters.dialog')}
          className="glass absolute right-0 z-30 mt-2 w-[min(calc(100vw-2rem),320px)] rounded-2xl p-4 shadow-2xl"
        >
          <Group
            title={t('filters.priority')}
            items={PRIORITIES.map((priority) => ({
              value: priority,
              label: withMark(PRIORITY_MARK[priority], t(PRIORITY_KEY[priority])),
            }))}
            selected={filters.priorities}
            onToggle={(value) =>
              setFilters({ ...filters, priorities: toggle(filters.priorities, value) })
            }
          />
          <Group
            title={t('filters.status')}
            items={STATUSES.map((status) => ({
              value: status,
              label: withMark(STATUS_MARK[status], t(STATUS_KEY[status])),
            }))}
            selected={filters.statuses}
            onToggle={(value) => setFilters({ ...filters, statuses: toggle(filters.statuses, value) })}
          />
          {categories.length > 0 ? (
            <Group
              title={t('filters.category')}
              items={categories.map((category) => ({ value: category.id, label: category.name }))}
              selected={filters.categoryIds}
              onToggle={(value) =>
                setFilters({ ...filters, categoryIds: toggle(filters.categoryIds, value) })
              }
            />
          ) : null}
          <Group
            title={t('filters.state')}
            items={COMPLETION.map((item) => ({ value: item.value, label: t(item.labelKey) }))}
            selected={[filters.completion]}
            onToggle={(value) => setFilters({ ...filters, completion: value })}
          />
          <button
            type="button"
            onClick={resetFilters}
            disabled={active === 0}
            className="mt-1 rounded-lg px-1 text-xs text-muted hover:text-ink disabled:opacity-40"
          >
            {t('filters.reset')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Group<T extends string>({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string
  items: { value: T; label: string }[]
  selected: T[]
  onToggle: (value: T) => void
}) {
  return (
    <fieldset className="mb-3.5">
      <legend className="text-[11px] uppercase tracking-[0.16em] text-faint">{title}</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => {
          const isSelected = selected.includes(item.value)
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(item.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition',
                isSelected
                  ? 'border-accent/40 bg-accent-soft text-accent'
                  : 'border-line text-muted hover:text-ink',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
