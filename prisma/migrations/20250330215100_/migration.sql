/*
  Warnings:

  - You are about to drop the column `firstName` on the `emergency_contacts` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `emergency_contacts` table. All the data in the column will be lost.
  - Added the required column `name` to the `emergency_contacts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "emergency_contacts" DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;
