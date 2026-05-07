-- CreateEnum
CREATE TYPE "ListingReminderType" AS ENUM ('H24', 'H2');

-- CreateTable
CREATE TABLE "listing_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "occurrenceStart" TIMESTAMP(3) NOT NULL,
    "reminderType" "ListingReminderType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_reminders_userId_idx" ON "listing_reminders"("userId");

-- CreateIndex
CREATE INDEX "listing_reminders_listingId_idx" ON "listing_reminders"("listingId");

-- CreateIndex
CREATE INDEX "listing_reminders_occurrenceStart_idx" ON "listing_reminders"("occurrenceStart");

-- CreateIndex
CREATE INDEX "listing_reminders_reminderType_idx" ON "listing_reminders"("reminderType");

-- CreateIndex
CREATE INDEX "listing_reminders_sentAt_idx" ON "listing_reminders"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "listing_reminders_userId_listingId_occurrenceStart_reminder_key" ON "listing_reminders"("userId", "listingId", "occurrenceStart", "reminderType");

-- AddForeignKey
ALTER TABLE "listing_reminders" ADD CONSTRAINT "listing_reminders_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
