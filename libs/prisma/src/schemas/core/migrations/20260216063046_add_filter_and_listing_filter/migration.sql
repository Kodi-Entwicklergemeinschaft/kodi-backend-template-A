-- CreateTable
CREATE TABLE "filters" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "languageCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_filters" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "filterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "filters_provider_idx" ON "filters"("provider");

-- CreateIndex
CREATE INDEX "filters_field_idx" ON "filters"("field");

-- CreateIndex
CREATE INDEX "filters_listingType_idx" ON "filters"("listingType");

-- CreateIndex
CREATE INDEX "filters_isActive_idx" ON "filters"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "filters_provider_field_listingType_value_key" ON "filters"("provider", "field", "listingType", "value");

-- CreateIndex
CREATE INDEX "listing_filters_listingId_idx" ON "listing_filters"("listingId");

-- CreateIndex
CREATE INDEX "listing_filters_filterId_idx" ON "listing_filters"("filterId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_filters_listingId_filterId_key" ON "listing_filters"("listingId", "filterId");

-- AddForeignKey
ALTER TABLE "listing_filters" ADD CONSTRAINT "listing_filters_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_filters" ADD CONSTRAINT "listing_filters_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "filters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
