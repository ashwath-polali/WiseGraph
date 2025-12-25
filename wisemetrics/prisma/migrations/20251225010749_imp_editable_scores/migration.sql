/*
  Warnings:

  - A unique constraint covering the columns `[studentId,categoryId,subcategoryId]` on the table `Score` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Score_studentId_categoryId_subcategoryId_key" ON "Score"("studentId", "categoryId", "subcategoryId");
