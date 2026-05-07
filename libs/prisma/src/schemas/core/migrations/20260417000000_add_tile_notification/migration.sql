-- Add sendNotification column to tiles
ALTER TABLE "tiles" ADD COLUMN "sendNotification" BOOLEAN NOT NULL DEFAULT false;

-- Change isActive default from true to false
ALTER TABLE "tiles" ALTER COLUMN "isActive" SET DEFAULT false;

-- Create tile_notification_logs table
CREATE TABLE "tile_notification_logs" (
    "id" TEXT NOT NULL,
    "tileId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tile_notification_logs_pkey" PRIMARY KEY ("id")
);

-- Add index
CREATE INDEX "tile_notification_logs_tileId_idx" ON "tile_notification_logs"("tileId");

-- Add foreign key with cascade delete
ALTER TABLE "tile_notification_logs" ADD CONSTRAINT "tile_notification_logs_tileId_fkey"
    FOREIGN KEY ("tileId") REFERENCES "tiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
