import { useTranslation } from '../../hooks/useTranslation'
import { APP_NAME } from '../../lib/constants'
import { LogoMark } from '../ui/Logo'

export function SplashScreen() {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label={t('common.loading', { app: APP_NAME })}>
      <div className="flex flex-col items-center gap-4">
        <LogoMark className="h-10 w-10 animate-pulse" />
        <span className="h-1 w-24 overflow-hidden rounded-full bg-ink/8">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-accent" />
        </span>
      </div>
    </div>
  )
}
