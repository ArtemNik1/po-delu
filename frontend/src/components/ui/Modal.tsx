import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'
import { IconButton } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Centred dialog on desktop, bottom sheet on phones. Escape closes the
 * topmost overlay.
 */
export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation()
  useFocusTrap(open, dialogRef)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-70 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'glass safe-bottom max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl p-6 shadow-2xl sm:max-w-md sm:rounded-3xl',
              className,
            )}
          >
            <div className={cn('flex items-start justify-between gap-4', children ? 'mb-5' : 'mb-1')}>
              <div>
                <h2 id={titleId} className="font-serif text-2xl leading-tight">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1.5 text-sm leading-6 text-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              <IconButton label={t('common.close')} onClick={onClose} className="-mr-2 -mt-1">
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            {children}
            {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
