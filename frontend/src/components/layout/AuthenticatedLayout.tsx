import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { CategoryModal } from '../categories/CategoryModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { OfflineIndicator } from '../ui/OfflineIndicator'

/**
 * Owns everything that must exist once per signed-in session: the initial data
 * fetch, refresh-on-focus and the overlay layer.
 */
export function AuthenticatedLayout() {
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const load = useDataStore((state) => state.load)
  const subscribe = useDataStore((state) => state.subscribe)
  const online = useOnlineStatus()

  useEscapeToClose()

  useEffect(() => {
    if (!userId) return
    void load(userId)
    return subscribe(userId)
  }, [userId, load, subscribe])

  useEffect(() => {
    if (!userId || !online) return
    void load(userId, { silent: true })
  }, [online, userId, load])

  return (
    <>
      <Outlet />
      <CategoryModal />
      <ConfirmDialog />
      <OfflineIndicator />
    </>
  )
}
