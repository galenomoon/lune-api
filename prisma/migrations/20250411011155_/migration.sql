/*
  Warnings:

  - Added the required column `gridItemId` to the `TrialClass` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TrialClass" ADD COLUMN     "gridItemId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TrialClass" ADD CONSTRAINT "TrialClass_gridItemId_fkey" FOREIGN KEY ("gridItemId") REFERENCES "grid_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
