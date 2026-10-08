-- Soft-deleted tasks stay in the table so restore can keep dates and subtasks.
ALTER TABLE "tasks" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- The product week always starts on Monday. Other settings columns are untouched.
UPDATE "user_settings" SET "weekStartsOn" = 1 WHERE "weekStartsOn" <> 1;
