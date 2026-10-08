import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { Wordmark } from '../components/ui/Logo'
import { useTranslation } from '../hooks/useTranslation'
import { DAILY_GOAL_PRESETS } from '../lib/constants'
import { useAuthStore } from '../store/authStore'
import { firstName } from '../utils/dates'

const TOTAL_STEPS = 3

export function OnboardingPage() {
  const profile = useAuthStore((state) => state.profile)
  const email = useAuthStore((state) => state.user?.email ?? null)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const updateSettings = useAuthStore((state) => state.updateSettings)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile?.display_name ?? '')
  const [goal, setGoal] = useState(5)
  const [finishing, setFinishing] = useState(false)

  async function finish() {
    setFinishing(true)
    const trimmed = name.trim()
    if (trimmed && trimmed !== profile?.display_name) await updateProfile({ display_name: trimmed })
    await updateSettings({ daily_goal: goal, onboarding_completed: true })
    setFinishing(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7 shadow-2xl"
        >
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full transition ${
                  index <= step ? 'bg-accent' : 'bg-ink/10'
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-faint">
            {t('onboarding.step', { current: step + 1, total: TOTAL_STEPS })}
          </p>

          {step === 0 ? (
            <>
              <h1 className="mt-3 font-serif text-[2rem] leading-tight">{t('onboarding.nameTitle')}</h1>
              <p className="mt-2 text-sm text-muted">{t('onboarding.nameSubtitle')}</p>
              <form
                className="mt-6"
                onSubmit={(event) => {
                  event.preventDefault()
                  setStep(1)
                }}
              >
                <Field label={t('settings.displayName')}>
                  {(id) => (
                    <Input
                      id={id}
                      autoFocus
                      maxLength={60}
                      placeholder={firstName(null, email)}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  )}
                </Field>
                <Button className="mt-6 w-full" type="submit">
                  {t('common.continue')}
                </Button>
              </form>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <h1 className="mt-3 font-serif text-[2rem] leading-tight">{t('onboarding.goalTitle')}</h1>
              <p className="mt-2 text-sm text-muted">{t('onboarding.goalSubtitle')}</p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {DAILY_GOAL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={goal === preset}
                    onClick={() => setGoal(preset)}
                    className={`h-12 w-16 rounded-2xl border text-sm transition ${
                      goal === preset
                        ? 'border-accent bg-accent-soft text-ink'
                        : 'border-line text-muted hover:text-ink'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <Input
                  type="number"
                  min={1}
                  max={50}
                  inputMode="numeric"
                  aria-label={t('onboarding.goalAria')}
                  className="h-12 w-24"
                  value={goal}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    if (value >= 1 && value <= 50) setGoal(value)
                  }}
                />
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  {t('common.back')}
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)}>
                  {t('common.continue')}
                </Button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1 className="mt-3 font-serif text-[2rem] leading-tight">{t('onboarding.readyTitle')}</h1>
              <p className="mt-3 text-sm leading-6 text-muted">{t('onboarding.readySubtitle')}</p>
              <Button className="mt-6 w-full" loading={finishing} onClick={() => void finish()}>
                {t('onboarding.openToday')}
              </Button>
            </>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
