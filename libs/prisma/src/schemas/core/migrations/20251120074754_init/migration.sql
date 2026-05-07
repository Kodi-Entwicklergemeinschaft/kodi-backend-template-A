-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "languageCode" TEXT;

-- AlterTable
ALTER TABLE "city_categories" ADD COLUMN     "languageCode" TEXT;

-- AlterTable
ALTER TABLE "parking_spaces" ADD COLUMN     "languageCode" TEXT;

-- AlterTable
ALTER TABLE "tiles" ADD COLUMN     "languageCode" TEXT;
