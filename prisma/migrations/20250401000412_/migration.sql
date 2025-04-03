-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_enrollmentId_fkey";

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
