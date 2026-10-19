import { Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../hooks/useTranslation'
import { isDemoToken } from '../../services/demoApi'
import { useUiStore } from '../../store/uiStore'
import { MobileHeader, MobileTabBar } from './MobileNav'
import { Sidebar } from './Sidebar'
import { TaskDetails } from '../tasks/TaskDetails'

export function AppShell() {
  const demo = isDemoToken(useAuthStore((state) => state.token))
  const { t } = useTranslation()
  const detailsOpen = useUiStore((state) => state.selectedTaskId !== null)
  const location = useLocation()

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main
          id="main"
          className={`min-w-0 flex-1 px-4 pb-32 pt-6 transition-[padding] duration-200 md:px-10 md:pb-12 md:pt-9 ${
            detailsOpen ? 'md:pr-[432px]' : ''
          }`}
        >
          {demo ? <p className="mb-5 rounded-xl border border-line bg-elevated/60 px-4 py-3 text-xs leading-relaxed text-muted">{t('demo.banner')}</p> : null}
          <Outlet key={location.pathname} />
        </main>
        <MobileTabBar />
      </div>
      <TaskDetails />
    </div>
  )
}
