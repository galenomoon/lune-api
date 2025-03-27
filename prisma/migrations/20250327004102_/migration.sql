/*
  Warnings:

  - You are about to drop the column `recurrence` on the `plans` table. All the data in the column will be lost.
  - Added the required column `durationInDays` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "recurrence",
ADD COLUMN     "durationInDays" INTEGER NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;
