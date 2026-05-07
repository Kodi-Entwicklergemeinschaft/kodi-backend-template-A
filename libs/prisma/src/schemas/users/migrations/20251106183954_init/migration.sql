/*
  Warnings:

  - A unique constraint covering the columns `[version,locale,cityId]` on the table `terms_of_use` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "terms_of_use_version_locale_key";

-- AlterTable
ALTER TABLE "terms_of_use" ADD COLUMN     "cityId" TEXT;

-- CreateIndex
CREATE INDEX "terms_of_use_cityId_idx" ON "terms_of_use"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_of_use_version_locale_cityId_key" ON "terms_of_use"("version", "locale", "cityId");
