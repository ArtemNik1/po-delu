import type { ThemePreference } from '../types/database'

export function resolveTheme(theme: string | null | undefined): ThemePreference {
  if (theme === 'light' || theme === 'colorblind' || theme === 'dark') return theme
  return 'dark'
}

export const THEME_COLOR: Record<ThemePreference, string> = {
  dark: '#07070a',
  light: '#f4f2ed',
  colorblind: '#0b1014',
}
