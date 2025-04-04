-- DropForeignKey
ALTER TABLE "ContractSignToken" DROP CONSTRAINT "ContractSignToken_enrollmentId_fkey";

-- AddForeignKey
ALTER TABLE "ContractSignToken" ADD CONSTRAINT "ContractSignToken_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
