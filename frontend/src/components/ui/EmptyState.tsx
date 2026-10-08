import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <p className="font-serif text-3xl leading-tight text-ink">{title}</p>
      <p className="mt-2.5 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function TaskSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1.5" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-3 rounded-2xl border border-line bg-elevated/40 px-4 py-4"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <div className="h-5 w-5 rounded-md bg-ink/8" />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-full bg-ink/8" style={{ width: `${72 - index * 7}%` }} />
            <div className="h-2 w-24 rounded-full bg-ink/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl border border-line bg-elevated/40 ${className ?? 'h-32'}`} aria-hidden />
}
