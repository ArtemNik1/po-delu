import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'

const MIN_PASSWORD = 8

export function RegisterPage() {
  const signUp = useAuthStore((state) => state.signUp)
  const submitting = useAuthStore((state) => state.submitting)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email.includes('@')) {
      setError(t('auth.invalidEmail'))
      return
    }
    if (password.length < MIN_PASSWORD) {
      setError(t('auth.passwordTooShort', { count: MIN_PASSWORD }))
      return
    }

    const result = await signUp(email, password, displayName.trim() || undefined)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/onboarding', { replace: true })
  }

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link className="text-ink underline-offset-4 hover:underline" to="/login">
            {t('auth.signIn')}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
        <Field label={t('auth.displayName')} hint={t('auth.optional')}>
          {(id) => (
            <Input
              id={id}
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          )}
        </Field>

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

        <Field label={t('auth.password')} hint={t('auth.passwordHint', { count: MIN_PASSWORD })}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD}
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
          {t('auth.createAccount')}
        </Button>
      </form>
    </AuthShell>
  )
}
