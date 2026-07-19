-- CreateTable
CREATE TABLE "UniversalTemplate" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniversalTemplate_teacherId_key" ON "UniversalTemplate"("teacherId");

-- AddForeignKey
ALTER TABLE "UniversalTemplate" ADD CONSTRAINT "UniversalTemplate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
