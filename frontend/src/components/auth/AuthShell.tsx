import type { ReactNode } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { LANGUAGES } from '../../lib/i18n'
import { useAuthStore } from '../../store/authStore'
import { Wordmark } from '../ui/Logo'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  const { t, language } = useTranslation()
  const applyLanguage = useAuthStore((state) => state.applyLanguage)

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="page-enter w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Wordmark />
          <p className="text-xs text-faint">{t('app.tagline')}</p>
          <div className="mt-2 flex gap-1" role="group" aria-label={t('auth.switchLanguage')}>
            {LANGUAGES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={language === item.value}
                onClick={() => applyLanguage(item.value)}
                className={`rounded-full px-3 py-1 text-[11px] transition ${
                  language === item.value
                    ? 'bg-accent-soft text-ink'
                    : 'text-faint hover:text-muted'
                }`}
              >
                {item.nativeLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-[28px] p-7 shadow-2xl">
          <h1 className="font-serif text-[2rem] leading-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </div>
  )
}
