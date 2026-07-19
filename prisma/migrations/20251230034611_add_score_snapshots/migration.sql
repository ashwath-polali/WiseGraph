-- CreateTable
CREATE TABLE "ScoreSnapshot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT,
    "teacherId" TEXT NOT NULL,
    "psychStudentId" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotScore" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "categoryId" TEXT,
    "categoryName" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "subcategoryName" TEXT,
    "standardScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnapshotScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoreSnapshot_classId_idx" ON "ScoreSnapshot"("classId");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_psychStudentId_idx" ON "ScoreSnapshot"("psychStudentId");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_teacherId_idx" ON "ScoreSnapshot"("teacherId");

-- CreateIndex
CREATE INDEX "SnapshotScore_snapshotId_idx" ON "SnapshotScore"("snapshotId");

-- CreateIndex
CREATE INDEX "SnapshotScore_studentId_idx" ON "SnapshotScore"("studentId");

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_psychStudentId_fkey" FOREIGN KEY ("psychStudentId") REFERENCES "PsychStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnapshotScore" ADD CONSTRAINT "SnapshotScore_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ScoreSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
