import { describe, expect, it } from 'vitest'
import { resolveTheme } from '../theme'

describe('resolveTheme', () => {
  it('keeps light, dark and colorblind', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
    expect(resolveTheme('colorblind')).toBe('colorblind')
  })

  it('maps the removed system theme to dark', () => {
    expect(resolveTheme('system')).toBe('dark')
    expect(resolveTheme(null)).toBe('dark')
    expect(resolveTheme(undefined)).toBe('dark')
  })
})
