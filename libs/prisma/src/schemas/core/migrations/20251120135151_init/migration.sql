-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalValue" TEXT NOT NULL,
    "label" TEXT,
    "languageCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_tags" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tags_provider_idx" ON "tags"("provider");

-- CreateIndex
CREATE INDEX "tags_externalValue_idx" ON "tags"("externalValue");

-- CreateIndex
CREATE UNIQUE INDEX "tags_provider_externalValue_key" ON "tags"("provider", "externalValue");

-- CreateIndex
CREATE INDEX "listing_tags_listingId_idx" ON "listing_tags"("listingId");

-- CreateIndex
CREATE INDEX "listing_tags_tagId_idx" ON "listing_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_tags_listingId_tagId_key" ON "listing_tags"("listingId", "tagId");

-- AddForeignKey
ALTER TABLE "listing_tags" ADD CONSTRAINT "listing_tags_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_tags" ADD CONSTRAINT "listing_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
