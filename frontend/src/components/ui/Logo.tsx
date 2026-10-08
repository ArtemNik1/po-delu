import { Check } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'
import { APP_NAME } from '../../lib/constants'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line bg-elevated text-accent',
        className,
      )}
    >
      <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </span>
  )
}

export function Wordmark({ withTagline = false }: { withTagline?: boolean }) {
  const { t } = useTranslation()

  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight">{APP_NAME}</span>
        {withTagline ? (
          <span className="block text-[11px] text-faint">{t('app.tagline')}</span>
        ) : null}
      </span>
    </span>
  )
}
