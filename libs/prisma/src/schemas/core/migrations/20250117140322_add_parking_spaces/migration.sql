-- CreateTable
CREATE TABLE "parking_spaces" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "parkingSiteId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OffStreetParking',
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "address" TEXT,
    "totalSpotNumber" INTEGER,
    "occupiedSpotNumber" INTEGER,
    "availableSpotNumber" INTEGER,
    "occupancy" DECIMAL(5,4),
    "fourWheelerSlots" JSONB,
    "twoWheelerSlots" JSONB,
    "unclassifiedSlots" JSONB,
    "status" TEXT,
    "outOfServiceSlotNumber" INTEGER,
    "category" JSONB,
    "allowedVehicleType" JSONB,
    "chargeType" JSONB,
    "acceptedPaymentMethod" JSONB,
    "priceRatePerMinute" DECIMAL(10,4),
    "priceCurrency" TEXT,
    "occupancyModified" TIMESTAMP(3),
    "observationDateTime" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parking_spaces_cityId_parkingSiteId_key" ON "parking_spaces"("cityId", "parkingSiteId");

-- CreateIndex
CREATE INDEX "parking_spaces_cityId_idx" ON "parking_spaces"("cityId");

-- CreateIndex
CREATE INDEX "parking_spaces_integrationId_idx" ON "parking_spaces"("integrationId");

-- CreateIndex
CREATE INDEX "parking_spaces_parkingSiteId_idx" ON "parking_spaces"("parkingSiteId");

-- CreateIndex
CREATE INDEX "parking_spaces_status_idx" ON "parking_spaces"("status");
