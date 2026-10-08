import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '../../lib/cn'

const CONTROL =
  'w-full rounded-xl border border-line bg-elevated/60 text-sm text-ink transition placeholder:text-faint hover:border-line-strong focus:border-accent/60'

export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return <input className={cn(CONTROL, 'h-11 px-3.5', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
  return <textarea className={cn(CONTROL, 'min-h-24 resize-y px-3.5 py-3 leading-6', className)} {...props} />
}

export function Select({ className, children, ...props }: ComponentPropsWithRef<'select'>) {
  return (
    <select className={cn(CONTROL, 'h-11 appearance-none px-3', className)} {...props}>
      {children}
    </select>
  )
}

/** Label wrapper that wires `htmlFor` to a single control via a generated id. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
        {label}
      </label>
      {children(id)}
      {hint ? <p className="text-xs leading-5 text-faint">{hint}</p> : null}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-xl border border-line p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3.5 py-1.5 text-sm transition',
            value === option.value ? 'bg-accent-soft text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition',
        checked ? 'border-accent/50 bg-accent-soft' : 'border-line bg-elevated',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all duration-200',
          checked ? 'left-[22px] bg-accent' : 'left-0.5 bg-faint',
        )}
      />
    </button>
  )
}
