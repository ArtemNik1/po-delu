import { Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useUiStore } from '../../store/uiStore'
import { FilterPopover } from '../tasks/FilterPopover'
import { IconButton } from '../ui/Button'
import { Input } from '../ui/Field'

interface PageHeaderProps {
  eyebrow?: string
  title: ReactNode
  actions?: ReactNode
  showTools?: boolean
}

export function PageHeader({ eyebrow, title, actions, showTools = true }: PageHeaderProps) {
  const searchOpen = useUiStore((state) => state.searchOpen)
  const openSearch = useUiStore((state) => state.openSearch)
  const closeSearch = useUiStore((state) => state.closeSearch)
  const query = useUiStore((state) => state.searchQuery)
  const setSearchQuery = useUiStore((state) => state.setSearchQuery)
  const { t } = useTranslation()

  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] uppercase tracking-[0.2em] text-faint">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1.5 font-serif text-[2rem] leading-[1.1] tracking-tight md:text-[2.75rem]">
            {title}
          </h1>
        </div>

        {showTools ? (
          <div className="flex shrink-0 items-center gap-2">
            {searchOpen ? null : (
              <IconButton
                label={t('header.search')}
                onClick={openSearch}
                className="hidden border border-line md:grid"
              >
                <Search className="h-4 w-4" />
              </IconButton>
            )}
            <FilterPopover />
            {actions}
          </div>
        ) : (
          actions
        )}
      </div>

      {searchOpen ? (
        <div className="mt-4 flex items-center gap-2">
          <Input
            autoFocus
            aria-label={t('header.search')}
            placeholder={t('header.searchPlaceholder')}
            value={query}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <IconButton
            label={t('header.closeSearch')}
            onClick={closeSearch}
            className="border border-line"
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      ) : null}
    </header>
  )
}
