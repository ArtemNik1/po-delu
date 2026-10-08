import { AnimatePresence, motion } from 'framer-motion'
import { CloudOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
import { Button } from './Button'

export function OfflineIndicator() {
  const online = useOnlineStatus()
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {online ? null : (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed top-3 left-1/2 z-60 -translate-x-1/2"
        >
          <span className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-muted shadow-lg">
            <CloudOff className="h-3.5 w-3.5" aria-hidden />
            {t('offline.message')}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Shown when a saved token cannot be checked because the API is unreachable. */
export function OfflineScreen() {
  const retrySession = useAuthStore((state) => state.retrySession)
  const profileLoading = useAuthStore((state) => state.profileLoading)
  const { t } = useTranslation()

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6 text-ink">
      <div className="w-full max-w-sm text-center">
        <CloudOff className="mx-auto h-6 w-6 text-muted" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl">{t('session.offlineTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{t('session.offlineBody')}</p>
        <Button className="mt-6" onClick={() => void retrySession()} disabled={profileLoading}>
          {t('session.retry')}
        </Button>
      </div>
    </div>
  )
}
