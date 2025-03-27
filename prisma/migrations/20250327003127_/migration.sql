/*
  Warnings:

  - You are about to drop the column `weeklyHours` on the `plans` table. All the data in the column will be lost.
  - Added the required column `weeklyClasses` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "weeklyHours",
ADD COLUMN     "weeklyClasses" INTEGER NOT NULL;
