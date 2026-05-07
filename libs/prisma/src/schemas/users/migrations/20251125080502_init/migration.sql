/*
  Warnings:

  - You are about to drop the column `salutation` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "salutation",
ADD COLUMN     "salutationCode" TEXT;

-- CreateTable
CREATE TABLE "salutations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salutations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salutations_code_idx" ON "salutations"("code");

-- CreateIndex
CREATE INDEX "salutations_locale_idx" ON "salutations"("locale");

-- CreateIndex
CREATE INDEX "salutations_isActive_idx" ON "salutations"("isActive");

-- CreateIndex
CREATE INDEX "salutations_sortOrder_idx" ON "salutations"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "salutations_code_locale_key" ON "salutations"("code", "locale");

-- CreateIndex
CREATE INDEX "users_salutationCode_idx" ON "users"("salutationCode");
