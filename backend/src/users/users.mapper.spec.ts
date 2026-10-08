import { toPublicTheme } from './users.mapper';

describe('toPublicTheme', () => {
  it('keeps the supported themes', () => {
    expect(toPublicTheme('dark')).toBe('dark');
    expect(toPublicTheme('light')).toBe('light');
    expect(toPublicTheme('colorblind')).toBe('colorblind');
  });

  it('maps the removed system theme to dark', () => {
    expect(toPublicTheme('system')).toBe('dark');
  });
});
