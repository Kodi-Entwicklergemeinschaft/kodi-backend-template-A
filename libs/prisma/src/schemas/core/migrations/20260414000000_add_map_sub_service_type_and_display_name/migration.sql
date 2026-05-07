-- AlterEnum
ALTER TYPE "SubServiceItemType" ADD VALUE 'MAP';

-- AlterTable
ALTER TABLE "category_sub_services" ADD COLUMN "displayName" TEXT;
