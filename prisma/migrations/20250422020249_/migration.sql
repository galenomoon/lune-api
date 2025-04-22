/*
  Warnings:

  - Made the column `password` on table `teachers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "teachers" ALTER COLUMN "password" SET NOT NULL;
