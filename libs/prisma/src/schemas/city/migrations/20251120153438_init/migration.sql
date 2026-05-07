-- AlterTable
ALTER TABLE "cities" ADD COLUMN     "darkLogoUrl" TEXT,
ADD COLUMN     "key" TEXT,
ADD COLUMN     "lightLogoUrl" TEXT;

-- CreateIndex
CREATE INDEX "cities_key_idx" ON "cities"("key");
