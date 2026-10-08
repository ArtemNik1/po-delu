-- Replace the removed `system` theme with `colorblind`.
-- Rows that stored `system` become `dark`. No other user data is changed.

CREATE TYPE "ThemePreference_new" AS ENUM ('dark', 'light', 'colorblind');

ALTER TABLE "user_settings" ALTER COLUMN "theme" DROP DEFAULT;

ALTER TABLE "user_settings"
  ALTER COLUMN "theme" TYPE "ThemePreference_new"
  USING (
    CASE "theme"::text
      WHEN 'light' THEN 'light'
      WHEN 'colorblind' THEN 'colorblind'
      ELSE 'dark'
    END
  )::"ThemePreference_new";

DROP TYPE "ThemePreference";

ALTER TYPE "ThemePreference_new" RENAME TO "ThemePreference";

ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'dark';
