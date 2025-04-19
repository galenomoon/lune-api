/*
  Warnings:

  - You are about to drop the `TrialClass` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrialClass" DROP CONSTRAINT "TrialClass_gridItemId_fkey";

-- DropForeignKey
ALTER TABLE "TrialClass" DROP CONSTRAINT "TrialClass_leadId_fkey";

-- DropTable
DROP TABLE "TrialClass";

-- CreateTable
CREATE TABLE "trial_invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trial_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "gridItemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "inviteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trial_classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trial_invites_token_key" ON "trial_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "trial_classes_inviteId_key" ON "trial_classes"("inviteId");

-- AddForeignKey
ALTER TABLE "trial_classes" ADD CONSTRAINT "trial_classes_gridItemId_fkey" FOREIGN KEY ("gridItemId") REFERENCES "grid_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_classes" ADD CONSTRAINT "trial_classes_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "trial_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
