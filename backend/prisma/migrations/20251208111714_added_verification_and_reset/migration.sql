/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Owner` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Owner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Owner" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "settings" SET DEFAULT '{"currency":"USD","timezone":"UTC"}';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_type_key" ON "VerificationToken"("identifier", "type");
