import { motion } from 'framer-motion'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'

export function Checkbox({
  checked,
  onChange,
  label,
  size = 'md',
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  size?: 'sm' | 'md'
}) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? t('task.markActive', { title: label }) : t('task.complete', { title: label })}
      onClick={(event) => {
        event.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-md border transition duration-150',
        size === 'md' ? 'h-5 w-5' : 'h-4 w-4',
        checked
          ? 'border-accent bg-accent text-on-accent shadow-[0_0_14px_-4px_var(--glow)]'
          : 'border-line-strong hover:border-accent/70',
      )}
    >
      <motion.svg
        viewBox="0 0 16 16"
        className={size === 'md' ? 'h-3 w-3' : 'h-2.5 w-2.5'}
        initial={false}
        animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.5 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        aria-hidden
      >
        <path
          d="M3.5 8.3L6.4 11.2L12.5 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </button>
  )
}
