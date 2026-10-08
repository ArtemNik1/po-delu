import { User, UserSettings } from '@prisma/client';

type UserWithSettings = User & { settings: UserSettings | null };

/** Stored `system` (removed theme) is read as dark so old rows stay valid. */
export function toPublicTheme(theme: string): 'dark' | 'light' | 'colorblind' {
  if (theme === 'light' || theme === 'colorblind') return theme;
  return 'dark';
}

export function toPublicUser(user: UserWithSettings) {
  const settings = user.settings;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    profile: {
      id: user.id,
      display_name: user.displayName,
      avatar_url: null as string | null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    },
    settings: settings
      ? {
          user_id: settings.userId,
          theme: toPublicTheme(settings.theme),
          language: settings.language,
          week_starts_on: 1 as const,
          daily_goal: settings.dailyGoal,
          sound_enabled: settings.soundEnabled,
          onboarding_completed: settings.onboardingCompleted,
          created_at: settings.createdAt.toISOString(),
          updated_at: settings.updatedAt.toISOString(),
        }
      : null,
  };
}
