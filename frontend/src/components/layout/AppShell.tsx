import { Outlet, useLocation } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import { MobileHeader, MobileTabBar } from './MobileNav'
import { Sidebar } from './Sidebar'
import { TaskDetails } from '../tasks/TaskDetails'

export function AppShell() {
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
          <Outlet key={location.pathname} />
        </main>
        <MobileTabBar />
      </div>
      <TaskDetails />
    </div>
  )
}
