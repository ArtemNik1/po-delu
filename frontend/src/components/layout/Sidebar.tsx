import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Inbox,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sunrise,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'
import { APP_NAME } from '../../lib/constants'
import type { TranslationKey } from '../../lib/i18n'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import { firstName } from '../../utils/dates'
import { todayIso } from '../../utils/isoDate'
import { isInboxTask } from '../../utils/tasks'
import { IconButton } from '../ui/Button'
import { CategoryGlyph } from '../ui/CategoryGlyph'
import { LogoMark } from '../ui/Logo'

interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { to: '/', labelKey: 'nav.today', icon: Sunrise },
  { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarDays },
  { to: '/inbox', labelKey: 'nav.inbox', icon: Inbox },
  { to: '/completed', labelKey: 'nav.completed', icon: CheckCircle2 },
  { to: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
]

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setCategoryModalOpen = useUiStore((state) => state.setCategoryModalOpen)
  const setFilters = useUiStore((state) => state.setFilters)
  const filters = useUiStore((state) => state.filters)
  const profile = useAuthStore((state) => state.profile)
  const email = useAuthStore((state) => state.user?.email ?? null)
  const signOut = useAuthStore((state) => state.signOut)
  const requestConfirm = useUiStore((state) => state.requestConfirm)
  const categories = useDataStore((state) => state.categories)
  const tasks = useDataStore((state) => state.tasks)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const name = firstName(profile?.display_name, email)
  const counts = useMemo(() => {
    const today = todayIso()
    return {
      '/': tasks.filter((task) => task.status !== 'done' && task.dueDate === today).length,
      '/upcoming': tasks.filter((task) => task.status !== 'done' && task.dueDate > today).length,
      '/inbox': tasks.filter(isInboxTask).length,
    } as Record<string, number>
  }, [tasks])

  return (
    <aside
      aria-label={t('nav.primary')}
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-elevated/25 py-5 transition-[width] duration-200 md:flex',
        collapsed ? 'w-[76px] px-3' : 'w-[248px] px-4',
      )}
    >
      <div className={cn('mb-7 flex items-center', collapsed ? 'flex-col gap-3' : 'justify-between px-1')}>
        <NavLink to="/" className="flex items-center gap-2.5" aria-label={t('nav.home', { app: APP_NAME })}>
          <LogoMark />
          {!collapsed ? <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span> : null}
        </NavLink>
        <IconButton
          label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </IconButton>
      </div>

      <nav className="space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? t(item.labelKey) : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-ink/5 hover:text-ink',
                isActive && 'bg-accent-soft text-ink shadow-[inset_0_0_0_1px_var(--accent-soft)]',
                collapsed && 'justify-center px-0',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed ? (
              <>
                <span className="flex-1">{t(item.labelKey)}</span>
                {counts[item.to] ? (
                  <span className="text-[11px] text-faint">{counts[item.to]}</span>
                ) : null}
              </>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-7 min-h-0 flex-1 overflow-y-auto no-scrollbar">
        {!collapsed ? (
          <p className="px-3 text-[10px] uppercase tracking-[0.18em] text-faint">{t('sidebar.categories')}</p>
        ) : null}
        <div className="mt-2 space-y-0.5">
          {categories.map((category) => {
            const isActive = filters.categoryIds.length === 1 && filters.categoryIds[0] === category.id
            return (
              <button
                key={category.id}
                type="button"
                title={collapsed ? category.name : undefined}
                aria-pressed={isActive}
                onClick={() =>
                  setFilters({ ...filters, categoryIds: isActive ? [] : [category.id] })
                }
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                  isActive ? 'bg-accent-soft text-ink' : 'text-muted hover:bg-ink/5 hover:text-ink',
                  collapsed && 'justify-center px-0',
                )}
              >
                <CategoryGlyph icon={category.icon} className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{category.name}</span> : null}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            title={collapsed ? t('sidebar.newCategory') : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-faint transition hover:text-ink',
              collapsed && 'justify-center px-0',
            )}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed ? t('sidebar.newCategory') : null}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-muted transition hover:bg-ink/5 hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
        >
          <Avatar name={name} />
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{name}</span>
              <span className="block truncate text-[11px] text-faint">{email}</span>
            </span>
          ) : null}
          {!collapsed ? <Settings className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
        </button>
        <button
          type="button"
          onClick={() =>
            requestConfirm({
              title: t('sidebar.signOutTitle'),
              description: t('sidebar.signOutDescription'),
              confirmLabel: t('sidebar.signOutConfirm'),
              onConfirm: () => void signOut(),
            })
          }
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-faint transition hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed ? t('sidebar.logout') : null}
        </button>
      </div>
    </aside>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-accent-soft text-xs font-semibold text-accent"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}
