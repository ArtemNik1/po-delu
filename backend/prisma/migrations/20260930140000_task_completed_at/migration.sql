-- Service timestamp of the latest transition into status = done.
-- Existing rows stay NULL: their completion day is unknown and must not be invented.
ALTER TABLE "tasks" ADD COLUMN "completedAt" TIMESTAMP(3);
