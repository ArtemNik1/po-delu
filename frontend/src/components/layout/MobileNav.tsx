import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Inbox,
  Plus,
  Search,
  Sunrise,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { APP_NAME } from '../../lib/constants'
import type { TranslationKey } from '../../lib/i18n'
import { useAuthStore } from '../../store/authStore'
import { openQuickAdd, useUiStore } from '../../store/uiStore'
import { firstName } from '../../utils/dates'
import { IconButton } from '../ui/Button'
import { LogoMark } from '../ui/Logo'

// Shorter labels than the sidebar so five tabs fit a 360px screen.
const TABS: { to: string; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { to: '/', labelKey: 'nav.today', icon: Sunrise },
  { to: '/upcoming', labelKey: 'nav.upcomingShort', icon: CalendarDays },
  { to: '/inbox', labelKey: 'nav.inbox', icon: Inbox },
  { to: '/completed', labelKey: 'nav.completedShort', icon: CheckCircle2 },
  { to: '/analytics', labelKey: 'nav.analyticsShort', icon: BarChart3 },
]

export function MobileHeader() {
  const openSearch = useUiStore((state) => state.openSearch)
  const profile = useAuthStore((state) => state.profile)
  const email = useAuthStore((state) => state.user?.email ?? null)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const name = firstName(profile?.display_name, email)

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/85 px-4 py-2.5 backdrop-blur-xl md:hidden">
      <NavLink to="/" className="flex items-center gap-2" aria-label={t('nav.home', { app: APP_NAME })}>
        <LogoMark className="h-7 w-7" />
        <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
      </NavLink>
      <div className="flex items-center gap-1">
        <IconButton label={t('header.search')} onClick={openSearch}>
          <Search className="h-5 w-5" />
        </IconButton>
        <IconButton label={t('header.settings')} onClick={() => navigate('/settings')}>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-line bg-accent-soft text-[11px] font-semibold text-accent">
            {name.slice(0, 1).toUpperCase()}
          </span>
        </IconButton>
      </div>
    </header>
  )
}

/** Bottom tab bar plus a quick-add action, sized for thumbs. */
export function MobileTabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()

  return (
    <>
      <button
        type="button"
        aria-label={t('quickAdd.trigger')}
        onClick={() => openQuickAdd(pathname, navigate)}
        className="fixed bottom-24 right-4 z-40 grid h-13 w-13 place-items-center rounded-full bg-accent text-on-accent shadow-[0_10px_30px_-8px_var(--glow)] active:brightness-95 md:hidden"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </button>

      <nav
        aria-label={t('nav.primary')}
        className="glass safe-bottom fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl p-1 shadow-2xl md:hidden"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition ${
                isActive ? 'bg-accent-soft text-accent' : 'text-faint'
              }`
            }
          >
            <tab.icon className="h-4.5 w-4.5" aria-hidden />
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>
    </>
  )
}