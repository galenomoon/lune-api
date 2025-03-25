/*
  Warnings:

  - You are about to drop the `grid_classes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "grid_classes" DROP CONSTRAINT "grid_classes_classId_fkey";

-- DropTable
DROP TABLE "grid_classes";

-- CreateTable
CREATE TABLE "grid_items" (
    "id" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grid_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "grid_items" ADD CONSTRAINT "grid_items_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
