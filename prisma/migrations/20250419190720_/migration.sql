/*
  Warnings:

  - Added the required column `gridItemId` to the `trial_invites` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plans" ALTER COLUMN "weeklyClasses" DROP NOT NULL,
ALTER COLUMN "durationInDays" DROP NOT NULL;

-- AlterTable
ALTER TABLE "trial_invites" ADD COLUMN     "gridItemId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "trial_invites" ADD CONSTRAINT "trial_invites_gridItemId_fkey" FOREIGN KEY ("gridItemId") REFERENCES "grid_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
