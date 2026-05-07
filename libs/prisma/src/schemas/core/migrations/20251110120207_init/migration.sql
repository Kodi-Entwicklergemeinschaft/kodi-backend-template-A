/*
  Warnings:

  - You are about to drop the column `category` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `cityId` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `listings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `listings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `listings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ListingModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingVisibility" AS ENUM ('PUBLIC', 'CITY_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ListingSourceType" AS ENUM ('MANUAL', 'SCRAPER', 'INTEGRATION', 'API_IMPORT');

-- CreateEnum
CREATE TYPE "ListingRecurrenceFreq" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ListingMediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('NEWS', 'EVENT', 'GASTRO', 'TOUR', 'RESTAURANT', 'POI', 'HOTEL', 'ARTICLE', 'OTHER');

-- DropIndex
DROP INDEX "listings_category_idx";

-- DropIndex
DROP INDEX "listings_cityId_idx";

-- DropIndex
DROP INDEX "listings_userId_idx";

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "category",
DROP COLUMN "cityId",
DROP COLUMN "userId",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contentChecksum" TEXT,
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "eventEnd" TIMESTAMP(3),
ADD COLUMN     "eventStart" TIMESTAMP(3),
ADD COLUMN     "expireAt" TIMESTAMP(3),
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "featuredUntil" TIMESTAMP(3),
ADD COLUMN     "geoLat" DECIMAL(9,6),
ADD COLUMN     "geoLng" DECIMAL(9,6),
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "ingestNotes" TEXT,
ADD COLUMN     "ingestedAt" TIMESTAMP(3),
ADD COLUMN     "ingestedByService" TEXT,
ADD COLUMN     "isAllDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languageCode" TEXT,
ADD COLUMN     "lastEditedByUserId" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "moderationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "organizerContact" TEXT,
ADD COLUMN     "organizerName" TEXT,
ADD COLUMN     "primaryCityId" TEXT,
ADD COLUMN     "publishAt" TIMESTAMP(3),
ADD COLUMN     "registrationUrl" TEXT,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "shareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "sourceType" "ListingSourceType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "syncHash" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "venueName" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibility" "ListingVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CategoryType",
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_categories" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_cities" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "ListingMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_time_intervals" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "weekdays" TEXT[],
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "tz" TEXT NOT NULL,
    "freq" "ListingRecurrenceFreq" NOT NULL DEFAULT 'NONE',
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repeatUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_time_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_time_interval_exceptions" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "opensAt" TEXT,
    "closesAt" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_time_interval_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

-- CreateIndex
CREATE INDEX "listing_categories_categoryId_idx" ON "listing_categories"("categoryId");

-- CreateIndex
CREATE INDEX "listing_categories_listingId_idx" ON "listing_categories"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_categories_listingId_categoryId_key" ON "listing_categories"("listingId", "categoryId");

-- CreateIndex
CREATE INDEX "listing_cities_cityId_idx" ON "listing_cities"("cityId");

-- CreateIndex
CREATE INDEX "listing_cities_listingId_idx" ON "listing_cities"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_cities_listingId_cityId_key" ON "listing_cities"("listingId", "cityId");

-- CreateIndex
CREATE INDEX "listing_media_listingId_idx" ON "listing_media"("listingId");

-- CreateIndex
CREATE INDEX "listing_media_type_idx" ON "listing_media"("type");

-- CreateIndex
CREATE INDEX "listing_time_intervals_listingId_idx" ON "listing_time_intervals"("listingId");

-- CreateIndex
CREATE INDEX "listing_time_intervals_start_idx" ON "listing_time_intervals"("start");

-- CreateIndex
CREATE INDEX "listing_time_intervals_repeatUntil_idx" ON "listing_time_intervals"("repeatUntil");

-- CreateIndex
CREATE INDEX "listing_time_intervals_freq_interval_idx" ON "listing_time_intervals"("freq", "interval");

-- CreateIndex
CREATE INDEX "listing_time_interval_exceptions_listingId_idx" ON "listing_time_interval_exceptions"("listingId");

-- CreateIndex
CREATE INDEX "listing_time_interval_exceptions_date_idx" ON "listing_time_interval_exceptions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "listings_slug_key" ON "listings"("slug");

-- CreateIndex
CREATE INDEX "listings_moderationStatus_idx" ON "listings"("moderationStatus");

-- CreateIndex
CREATE INDEX "listings_visibility_idx" ON "listings"("visibility");

-- CreateIndex
CREATE INDEX "listings_publishAt_idx" ON "listings"("publishAt");

-- CreateIndex
CREATE INDEX "listings_expireAt_idx" ON "listings"("expireAt");

-- CreateIndex
CREATE INDEX "listings_isFeatured_idx" ON "listings"("isFeatured");

-- CreateIndex
CREATE INDEX "listings_primaryCityId_idx" ON "listings"("primaryCityId");

-- CreateIndex
CREATE INDEX "listings_sourceType_idx" ON "listings"("sourceType");

-- CreateIndex
CREATE INDEX "listings_updatedAt_idx" ON "listings"("updatedAt");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_categories" ADD CONSTRAINT "listing_categories_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_categories" ADD CONSTRAINT "listing_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_cities" ADD CONSTRAINT "listing_cities_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_time_intervals" ADD CONSTRAINT "listing_time_intervals_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_time_interval_exceptions" ADD CONSTRAINT "listing_time_interval_exceptions_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
