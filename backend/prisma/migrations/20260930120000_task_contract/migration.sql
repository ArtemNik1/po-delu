-- Align tasks with the exam contract without dropping users, categories, or subtasks.
-- Done wins when the old completed flag and status disagree.
-- A missing taskDate becomes the UTC calendar date of createdAt, so the day
-- does not depend on the database session time zone.

CREATE TYPE "TaskStatus_new" AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE "Priority_new" AS ENUM ('low', 'medium', 'high');

ALTER TABLE "tasks" ADD COLUMN "dueDate" DATE;
ALTER TABLE "tasks" ADD COLUMN "status_new" "TaskStatus_new";
ALTER TABLE "tasks" ADD COLUMN "priority_new" "Priority_new";

UPDATE "tasks"
SET
  "status_new" = CASE
    WHEN "completed" = true OR "status"::text = 'completed' THEN 'done'::"TaskStatus_new"
    WHEN "status"::text = 'in_progress' THEN 'in_progress'::"TaskStatus_new"
    ELSE 'todo'::"TaskStatus_new"
  END,
  "priority_new" = CASE
    WHEN "priority"::text = 'critical' THEN 'high'::"Priority_new"
    ELSE "priority"::text::"Priority_new"
  END,
  "dueDate" = COALESCE("taskDate", ("createdAt" AT TIME ZONE 'UTC')::date),
  "description" = COALESCE("description", '');

ALTER TABLE "tasks" ALTER COLUMN "description" SET DEFAULT '';
ALTER TABLE "tasks" ALTER COLUMN "description" SET NOT NULL;

DROP INDEX "tasks_userId_completed_idx";
DROP INDEX "tasks_userId_taskDate_idx";

ALTER TABLE "tasks" DROP COLUMN "completed";
ALTER TABLE "tasks" DROP COLUMN "completedAt";
ALTER TABLE "tasks" DROP COLUMN "taskDate";
ALTER TABLE "tasks" DROP COLUMN "status";
ALTER TABLE "tasks" DROP COLUMN "priority";

ALTER TABLE "tasks" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "tasks" RENAME COLUMN "priority_new" TO "priority";

ALTER TABLE "tasks" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo';
ALTER TABLE "tasks" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 'medium';
ALTER TABLE "tasks" ALTER COLUMN "dueDate" SET NOT NULL;

DROP TYPE "TaskStatus";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "Priority";
ALTER TYPE "Priority_new" RENAME TO "Priority";

CREATE INDEX "tasks_userId_dueDate_idx" ON "tasks"("userId", "dueDate");
CREATE INDEX "tasks_userId_status_idx" ON "tasks"("userId", "status");
