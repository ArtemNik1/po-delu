import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'
import { PRIORITY_KEY, PRIORITY_MARK, PRIORITY_SHORT } from '../../lib/constants'
import type { Priority } from '../../types/database'

const TONE: Record<Priority, string> = {
  low: 'text-low',
  medium: 'text-medium',
  high: 'text-high',
}

/** Arrow plus a short label, so priority is not carried by colour alone. */
export function PriorityMark({
  priority,
  compact = false,
  className,
}: {
  priority: Priority
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const full = t(PRIORITY_KEY[priority])
  const phrase = t('priority.aria', { priority: full })

  return (
    <span
      role="img"
      title={phrase}
      aria-label={phrase}
      className={cn('inline-flex shrink-0 items-center gap-1', className)}
    >
      <span
        aria-hidden
        className={cn(
          'inline-flex items-center gap-0.5 font-semibold uppercase tracking-[0.08em]',
          compact ? 'text-[10px]' : 'text-[10px] tracking-[0.14em]',
          TONE[priority],
        )}
      >
        {PRIORITY_MARK[priority]}
        {compact ? t(PRIORITY_SHORT[priority]) : full}
      </span>
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5">
      <PriorityMark priority={priority} />
    </span>
  )
}
