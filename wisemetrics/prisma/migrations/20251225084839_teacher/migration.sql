-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "defaultClassId" TEXT,
ADD COLUMN     "defaultStudentView" TEXT,
ADD COLUMN     "school" TEXT;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_defaultClassId_fkey" FOREIGN KEY ("defaultClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
