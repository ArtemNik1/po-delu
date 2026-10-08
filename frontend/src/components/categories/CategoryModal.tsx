import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { CATEGORY_ICON_KEYS, DEFAULT_CATEGORY_ICON } from '../../lib/constants'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { CategoryGlyph } from '../ui/CategoryGlyph'
import { Field, Input } from '../ui/Field'
import { Modal } from '../ui/Modal'

export function CategoryModal() {
  const open = useUiStore((state) => state.categoryModalOpen)
  const setOpen = useUiStore((state) => state.setCategoryModalOpen)
  const createCategory = useDataStore((state) => state.createCategory)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string>(DEFAULT_CATEGORY_ICON)

  function close() {
    setOpen(false)
    setName('')
    setIcon(DEFAULT_CATEGORY_ICON)
  }

  function submit() {
    if (!userId || !name.trim()) return
    void createCategory(userId, name, icon)
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('category.newTitle')}
      description={t('category.newDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            {t('category.create')}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Field label={t('category.name')}>
          {(id) => (
            <Input
              id={id}
              autoFocus
              maxLength={40}
              placeholder={t('category.namePlaceholder')}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>

        <fieldset className="mt-5">
          <legend className="text-[11px] uppercase tracking-[0.16em] text-faint">
            {t('category.icon')}
          </legend>
          <div className="mt-2.5 grid grid-cols-7 gap-2">
            {CATEGORY_ICON_KEYS.map((key) => {
              const selected = icon === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={t('category.iconAria', { name: key })}
                  aria-pressed={selected}
                  onClick={() => setIcon(key)}
                  className={`grid h-10 w-10 place-items-center rounded-xl border transition ${
                    selected
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-muted hover:border-line-strong hover:text-ink'
                  }`}
                >
                  <CategoryGlyph icon={key} />
                </button>
              )
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
