/*
  Warnings:

  - A unique constraint covering the columns `[guestId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deviceId,devicePlatform]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('REGISTERED', 'GUEST');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "devicePlatform" "DevicePlatform",
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "migratedFromGuestId" TEXT,
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'REGISTERED',
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "username" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_guestId_key" ON "users"("guestId");

-- CreateIndex
CREATE INDEX "users_guestId_idx" ON "users"("guestId");

-- CreateIndex
CREATE INDEX "users_deviceId_idx" ON "users"("deviceId");

-- CreateIndex
CREATE INDEX "users_userType_idx" ON "users"("userType");

-- CreateIndex
CREATE UNIQUE INDEX "users_deviceId_devicePlatform_key" ON "users"("deviceId", "devicePlatform");
