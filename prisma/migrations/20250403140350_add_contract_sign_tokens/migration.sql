-- CreateTable
CREATE TABLE "ContractSignToken" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "ContractSignToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractSignToken_enrollmentId_key" ON "ContractSignToken"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractSignToken_token_key" ON "ContractSignToken"("token");

-- AddForeignKey
ALTER TABLE "ContractSignToken" ADD CONSTRAINT "ContractSignToken_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
