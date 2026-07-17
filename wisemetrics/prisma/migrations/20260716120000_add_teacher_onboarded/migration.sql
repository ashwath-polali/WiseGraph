-- Track whether a teacher/psychologist has finished the first-run tour.
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "onboardedAt" TIMESTAMP(3);
