import { createElement } from 'react'
import { categoryIcon } from '../../lib/constants'

/** Renders one of the allow-listed Lucide icons by its stored key. */
export function CategoryGlyph({
  icon,
  className = 'h-4 w-4',
}: {
  icon: string | null | undefined
  className?: string
}) {
  return createElement(categoryIcon(icon ?? undefined), { className, 'aria-hidden': true })
}
