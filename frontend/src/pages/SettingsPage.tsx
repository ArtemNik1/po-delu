import { Check, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, IconButton } from '../components/ui/Button'
import { CategoryGlyph } from '../components/ui/CategoryGlyph'
import { Field, Input, Segmented, Switch } from '../components/ui/Field'
import { useTranslation } from '../hooks/useTranslation'
import { APP_NAME, DAILY_GOAL_PRESETS } from '../lib/constants'
import { resolveTheme } from '../lib/theme'
import { LANGUAGES, type Language } from '../lib/i18n'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { toast } from '../store/toastStore'
import { useUiStore } from '../store/uiStore'
import type { ThemePreference } from '../types/database'

export function SettingsPage() {
  const { t, language } = useTranslation()
  const email = useAuthStore((state) => state.user?.email ?? '')
  const profile = useAuthStore((state) => state.profile)
  const settings = useAuthStore((state) => state.settings)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const updateSettings = useAuthStore((state) => state.updateSettings)
  const signOut = useAuthStore((state) => state.signOut)
  const categories = useDataStore((state) => state.categories)
  const deleteCategory = useDataStore((state) => state.deleteCategory)
  const setCategoryModalOpen = useUiStore((state) => state.setCategoryModalOpen)
  const requestConfirm = useUiStore((state) => state.requestConfirm)

  // `null` means "not edited", so a profile update from elsewhere flows straight
  // through without an effect syncing props into state.
  const [draftName, setDraftName] = useState<string | null>(null)
  const name = draftName ?? profile?.display_name ?? ''

  const dailyGoal = settings?.daily_goal ?? 5
  const nameChanged = name.trim() !== (profile?.display_name ?? '') && name.trim().length > 0

  return (
    <div className="page-enter mx-auto max-w-2xl">
      <PageHeader eyebrow={t('settings.eyebrow')} title={t('settings.title')} showTools={false} />

      <div className="space-y-4">
        <Section title={t('settings.profile')} description={t('settings.profileDescription', { app: APP_NAME })}>
          <Field label={t('settings.displayName')}>
            {(id) => (
              <Input
                id={id}
                maxLength={60}
                value={name}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && nameChanged) save()
                }}
              />
            )}
          </Field>
          <Button className="mt-3" size="sm" disabled={!nameChanged} onClick={save}>
            <Check className="h-4 w-4" />
            {t('settings.saveName')}
          </Button>
        </Section>

        <Section title={t('settings.appearance')} description={t('settings.appearanceDescription')}>
          <Segmented<ThemePreference>
            label={t('settings.theme')}
            value={resolveTheme(settings?.theme)}
            onChange={(theme) => void updateSettings({ theme })}
            options={[
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
              { value: 'colorblind', label: t('settings.themeColorblind') },
            ]}
          />
        </Section>

        <Section title={t('settings.language')} description={t('settings.languageDescription')}>
          <Segmented<Language>
            label={t('settings.language')}
            value={language}
            onChange={(next) => void updateSettings({ language: next })}
            options={LANGUAGES.map((item) => ({
              value: item.value,
              label: item.nativeLabel,
            }))}
          />
        </Section>

        <Section title={t('settings.productivity')} description={t('settings.productivityDescription')}>
          <Field label={t('settings.dailyGoal')} hint={t('settings.dailyGoalHint')}>
            {(id) => (
              <div className="flex flex-wrap items-center gap-2">
                {DAILY_GOAL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={dailyGoal === preset}
                    onClick={() => void updateSettings({ daily_goal: preset })}
                    className={`h-11 w-14 rounded-xl border text-sm transition ${
                      dailyGoal === preset
                        ? 'border-accent bg-accent-soft text-ink'
                        : 'border-line text-muted hover:text-ink'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <Input
                  id={id}
                  type="number"
                  min={1}
                  max={50}
                  inputMode="numeric"
                  className="w-24"
                  value={dailyGoal}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    if (value >= 1 && value <= 50) void updateSettings({ daily_goal: value })
                  }}
                />
              </div>
            )}
          </Field>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">{t('settings.sound')}</p>
              <p className="mt-0.5 text-xs text-faint">{t('settings.soundDescription')}</p>
            </div>
            <Switch
              label={t('settings.sound')}
              checked={settings?.sound_enabled ?? true}
              onChange={(value) => void updateSettings({ sound_enabled: value })}
            />
          </div>
        </Section>

        <Section title={t('settings.categories')} description={t('settings.categoriesDescription')}>
          {categories.length === 0 ? (
            <p className="text-sm text-muted">{t('settings.noCategories')}</p>
          ) : (
            <ul className="space-y-1">
              {categories.map((category) => {
                return (
                  <li
                    key={category.id}
                    className="flex items-center gap-3 rounded-xl border border-line px-3 py-2"
                  >
                    <CategoryGlyph icon={category.icon} className="h-4 w-4 text-muted" />
                    <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
                    <IconButton
                      label={t('category.delete', { name: category.name })}
                      className="h-8 w-8"
                      onClick={() =>
                        requestConfirm({
                          title: t('confirm.deleteCategory.title', { name: category.name }),
                          description: t('confirm.deleteCategory.description'),
                          confirmLabel: t('confirm.deleteCategory.confirm'),
                          tone: 'danger',
                          onConfirm: () => void deleteCategory(category.id),
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </li>
                )
              })}
            </ul>
          )}
          <Button className="mt-3" variant="subtle" size="sm" onClick={() => setCategoryModalOpen(true)}>
            {t('sidebar.newCategory')}
          </Button>
        </Section>

        <Section title={t('settings.account')} description={t('settings.accountDescription')}>
          <p className="text-sm text-muted">{email}</p>
          <Button
            className="mt-4"
            variant="subtle"
            onClick={() =>
              requestConfirm({
                title: t('sidebar.signOutTitle'),
                description: t('sidebar.signOutDescription'),
                confirmLabel: t('sidebar.signOutConfirm'),
                onConfirm: () => void signOut(),
              })
            }
          >
            {t('sidebar.logout')}
          </Button>
        </Section>
      </div>
    </div>
  )

  async function save() {
    if (!nameChanged) return
    const ok = await updateProfile({ display_name: name.trim() })
    if (!ok) return
    setDraftName(null)
    toast({ kind: 'success', title: t('toast.profileUpdated') })
  }
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-3xl border border-line bg-elevated/40 p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-faint">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}
