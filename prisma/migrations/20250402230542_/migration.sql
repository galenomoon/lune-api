/*
  Warnings:

  - Made the column `signature` on table `enrollments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "enrollments" ALTER COLUMN "signature" SET NOT NULL;
