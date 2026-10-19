import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const signIn = useAuthStore((state) => state.signIn)
  const enterDemo = useAuthStore((state) => state.enterDemo)
  const demoOnly = import.meta.env.VITE_DEMO_ONLY === 'true'
  const submitting = useAuthStore((state) => state.submitting)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError(t('auth.missingCredentials'))
      return
    }
    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
      return
    }
    const from = (location.state as { from?: string } | null)?.from
    navigate(from && from.startsWith('/') ? from : '/', { replace: true })
  }

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t(demoOnly ? 'demo.only' : 'auth.loginSubtitle')}
      footer={demoOnly ? null : (
        <>
          {t('auth.noAccount')}{' '}
          <Link className="text-ink underline-offset-4 hover:underline" to="/register">
            {t('auth.createOne')}
          </Link>
        </>
      )}
    >
      {!demoOnly && <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
        <Field label={t('auth.email')}>
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </Field>

        <Field label={t('auth.password')}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>

        {error ? (
          <p role="alert" className="rounded-xl border border-critical/30 bg-critical/8 px-3 py-2 text-sm text-critical">
            {error}
          </p>
        ) : null}

        <Button className="w-full" type="submit" loading={submitting}>
          {t('auth.signIn')}
        </Button>
      </form>}
      <div className={demoOnly ? '' : 'mt-6 border-t border-line pt-5'}>
        <Button className="w-full" variant={demoOnly ? 'primary' : 'subtle'} onClick={() => { enterDemo(); navigate('/', { replace: true }) }}>
          {t('demo.open')}
        </Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted">{t('demo.description')}</p>
      </div>
    </AuthShell>
  )
}
