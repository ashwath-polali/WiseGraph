/*
  Warnings:

  - You are about to drop the column `score` on the `PsychSubtest` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `Teacher` table. All the data in the column will be lost.
  - Added the required column `standardScore` to the `PsychSubtest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PsychStudent" ADD COLUMN     "gradeLevel" TEXT;

-- AlterTable
ALTER TABLE "PsychSubtest" DROP COLUMN "score",
ADD COLUMN     "standardScore" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "plan",
ADD COLUMN     "accountType" TEXT NOT NULL DEFAULT 'teacher';

-- DropEnum
DROP TYPE "Plan";
