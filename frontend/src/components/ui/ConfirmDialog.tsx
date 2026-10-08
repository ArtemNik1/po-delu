import { useRef, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useUiStore } from '../../store/uiStore'
import { Button } from './Button'
import { Modal } from './Modal'

/** App-wide replacement for `window.confirm`. */
export function ConfirmDialog() {
  const confirm = useUiStore((state) => state.confirm)
  const closeConfirm = useUiStore((state) => state.closeConfirm)
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  async function confirmAction() {
    if (!confirm || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      const result = await confirm.onConfirm()
      if (result !== false) closeConfirm()
    } catch {
      // Keep the dialog mounted so the same action can be tried again.
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  return (
    <Modal
      open={confirm !== null}
      onClose={closeConfirm}
      title={confirm?.title ?? ''}
      description={confirm?.description}
      footer={
        <>
          <Button variant="ghost" onClick={closeConfirm} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={confirm?.tone === 'danger' ? 'danger' : 'primary'}
            loading={busy}
            onClick={() => {
              void confirmAction()
            }}
          >
            {confirm?.confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    />
  )
}
