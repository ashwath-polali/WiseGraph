-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('TEACHER', 'PSYCH');

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'TEACHER';

-- CreateTable
CREATE TABLE "PsychStudent" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychSubtest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychSubtest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PsychStudent_teacherId_name_key" ON "PsychStudent"("teacherId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PsychSubtest_studentId_name_key" ON "PsychSubtest"("studentId", "name");

-- AddForeignKey
ALTER TABLE "PsychStudent" ADD CONSTRAINT "PsychStudent_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychSubtest" ADD CONSTRAINT "PsychSubtest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "PsychStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
