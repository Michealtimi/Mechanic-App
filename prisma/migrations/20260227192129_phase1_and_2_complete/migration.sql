/*
  Warnings:

  - Made the column `mechanicId` on table `Dispatch` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('ORDERED', 'PAID', 'DELIVERED', 'DISPUTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ServiceRecordSource" AS ENUM ('MANUAL', 'TELEMETRY');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MERCHANT';

-- DropForeignKey
ALTER TABLE "Dispatch" DROP CONSTRAINT "Dispatch_mechanicId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_bookingId_fkey";

-- DropIndex
DROP INDEX "Dispatch_bookingId_key";

-- AlterTable
ALTER TABLE "Dispatch" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ALTER COLUMN "mechanicId" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OFFERED';

-- AlterTable
ALTER TABLE "Dispute" ALTER COLUMN "bookingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" TEXT,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VinCheckResult" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "ip" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VinCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionPin" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletionPin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobReceipt" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleServiceRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "bookingId" TEXT,
    "bookingSegmentId" TEXT,
    "type" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "odometerKm" DOUBLE PRECISION,
    "notes" TEXT,
    "source" "ServiceRecordSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueShare" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "mechanicCommission" DECIMAL(10,2) NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "mechanicId" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeocodeCache" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeocodeCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VinCheckResult_expiresAt_idx" ON "VinCheckResult"("expiresAt");

-- CreateIndex
CREATE INDEX "VinCheckResult_userId_idx" ON "VinCheckResult"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionPin_bookingId_key" ON "CompletionPin"("bookingId");

-- CreateIndex
CREATE INDEX "CompletionPin_bookingId_idx" ON "CompletionPin"("bookingId");

-- CreateIndex
CREATE INDEX "CompletionPin_expiresAt_idx" ON "CompletionPin"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobReceipt_bookingId_key" ON "JobReceipt"("bookingId");

-- CreateIndex
CREATE INDEX "JobReceipt_bookingId_idx" ON "JobReceipt"("bookingId");

-- CreateIndex
CREATE INDEX "VehicleServiceRecord_vehicleId_idx" ON "VehicleServiceRecord"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleServiceRecord_serviceDate_idx" ON "VehicleServiceRecord"("serviceDate");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueShare_bookingId_key" ON "RevenueShare"("bookingId");

-- CreateIndex
CREATE INDEX "RevenueShare_mechanicId_idx" ON "RevenueShare"("mechanicId");

-- CreateIndex
CREATE INDEX "RevenueShare_createdAt_idx" ON "RevenueShare"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConfig_key_key" ON "PlatformConfig"("key");

-- CreateIndex
CREATE INDEX "PlatformConfig_key_idx" ON "PlatformConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "GeocodeCache_address_key" ON "GeocodeCache"("address");

-- CreateIndex
CREATE INDEX "GeocodeCache_address_idx" ON "GeocodeCache"("address");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_mechanicId_idx" ON "Booking"("mechanicId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Dispatch_bookingId_idx" ON "Dispatch"("bookingId");

-- CreateIndex
CREATE INDEX "Dispatch_expiresAt_idx" ON "Dispatch"("expiresAt");

-- CreateIndex
CREATE INDEX "Dispute_bookingId_idx" ON "Dispute"("bookingId");

-- AddForeignKey
ALTER TABLE "VinCheckResult" ADD CONSTRAINT "VinCheckResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionPin" ADD CONSTRAINT "CompletionPin_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReceipt" ADD CONSTRAINT "JobReceipt_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleServiceRecord" ADD CONSTRAINT "VehicleServiceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
