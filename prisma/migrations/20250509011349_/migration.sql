-- CreateEnum
CREATE TYPE "WorkedHourStatus" AS ENUM ('PENDING', 'DONE', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateTable
CREATE TABLE "worked_hours" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "workedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "priceSnapshot" DOUBLE PRECISION NOT NULL,
    "status" "WorkedHourStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worked_hours_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "worked_hours" ADD CONSTRAINT "worked_hours_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worked_hours" ADD CONSTRAINT "worked_hours_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
