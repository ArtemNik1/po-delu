import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Wordmark } from '../components/ui/Logo'
import { useTranslation } from '../hooks/useTranslation'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="page-enter">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-faint">{t('notFound.eyebrow')}</p>
        <h1 className="mt-3 font-serif text-[2.5rem] leading-tight">{t('notFound.title')}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{t('notFound.description')}</p>
        <Button className="mt-7" onClick={() => navigate('/', { replace: true })}>
          {t('notFound.back')}
        </Button>
      </div>
    </div>
  )
}
