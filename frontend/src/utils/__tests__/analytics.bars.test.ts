import { describe, expect, it } from 'vitest'
import { barHeightPx } from '../analytics'

describe('barHeightPx', () => {
  it('makes 5 taller than 3 and 3 taller than 1', () => {
    const max = 5
    const one = barHeightPx(1, max)
    const three = barHeightPx(3, max)
    const five = barHeightPx(5, max)
    expect(five).toBeGreaterThan(three)
    expect(three).toBeGreaterThan(one)
    expect(one).toBeGreaterThan(barHeightPx(0, max))
  })
})
