import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'
import { useToastStore, type ToastKind } from '../../store/toastStore'

const MARK: Record<ToastKind, string> = {
  error: '!',
  success: '✓',
  info: 'i',
}

const TONE: Record<ToastKind, string> = {
  error: 'text-critical',
  success: 'text-accent',
  info: 'text-muted',
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)
  const { t } = useTranslation()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      aria-label={t('toast.notifications')}
      className="pointer-events-none fixed inset-x-4 bottom-24 z-80 flex flex-col gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:w-90"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="glass pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl"
          >
            <span
              aria-hidden
              className={cn('mt-0.5 w-4 shrink-0 text-center text-sm font-semibold', TONE[toast.kind])}
            >
              {MARK[toast.kind]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs leading-5 text-muted">{toast.description}</p>
              ) : null}
            </div>
            {toast.action ? (
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
              >
                {toast.action.label}
              </button>
            ) : (
              <button
                type="button"
                aria-label={t('toast.dismiss')}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-faint hover:text-ink"
                onClick={() => dismiss(toast.id)}
              >
                {t('common.close')}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
