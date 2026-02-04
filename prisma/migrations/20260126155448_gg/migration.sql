/*
  Warnings:

  - You are about to alter the column `price` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[customerId,mechanicId,bookingSegmentId]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pickupAddress` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLatitude` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLongitude` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentEventType" AS ENUM ('INITIATED', 'VERIFIED', 'WEBHOOK', 'CAPTURED', 'REFUND', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('B2B', 'B2C');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'MEMBER');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('EV', 'ICE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SegmentStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MetricSource" AS ENUM ('MANUAL', 'SMARTCAR', 'TOR_LOCO', 'HYUNDAI', 'OTHER');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('SEARCHING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "SlaStatus" AS ENUM ('PENDING', 'MET', 'BREACHED');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_mechanicId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_walletId_fkey";

-- DropIndex
DROP INDEX "ChatRoom_bookingId_key";

-- DropIndex
DROP INDEX "ChatRoom_customerId_mechanicId_key";

-- DropIndex
DROP INDEX "Payment_bookingId_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "orgId" TEXT,
ADD COLUMN     "pickupAddress" TEXT NOT NULL,
ADD COLUMN     "pickupLatitude" DECIMAL(10,8) NOT NULL,
ADD COLUMN     "pickupLocationNotes" TEXT,
ADD COLUMN     "pickupLongitude" DECIMAL(11,8) NOT NULL,
ADD COLUMN     "platformFee" DECIMAL(10,2),
ADD COLUMN     "totalPrice" DECIMAL(10,2),
ADD COLUMN     "vehicleId" TEXT,
ALTER COLUMN "mechanicId" DROP NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "bookingSegmentId" TEXT;

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "bookingSegmentId" TEXT,
ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "escalatedBy" TEXT,
ADD COLUMN     "escalationLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "evidenceUrls" TEXT[],
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "bookingSegmentId" TEXT,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "walletFrom" TEXT,
ADD COLUMN     "walletTo" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "orgWalletId" TEXT,
ALTER COLUMN "walletId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayEvent" TEXT NOT NULL,
    "type" "PaymentEventType" NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "OrgType" NOT NULL DEFAULT 'B2C',
    "walletBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vin" TEXT,
    "type" "VehicleType" NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "telematics" JSONB,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSegment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "mechanicId" TEXT,
    "type" TEXT NOT NULL,
    "status" "SegmentStatus" NOT NULL DEFAULT 'PENDING',
    "price" DECIMAL(10,2) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EVMetric" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "batteryLevel" DOUBLE PRECISION,
    "soc" DOUBLE PRECISION,
    "rangeKm" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "MetricSource" NOT NULL DEFAULT 'MANUAL',
    "metadata" JSONB,

    CONSTRAINT "EVMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationWallet" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pending" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "mechanicId" TEXT,
    "status" "DispatchStatus" NOT NULL DEFAULT 'SEARCHING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "SlaStatus" NOT NULL DEFAULT 'PENDING',
    "breachReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expectedArrivalMs" INTEGER,
    "distanceMeters" INTEGER,

    CONSTRAINT "SlaRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_gateway_gatewayEvent_key" ON "PaymentEvent"("gateway", "gatewayEvent");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_orgId_idx" ON "Vehicle"("orgId");

-- CreateIndex
CREATE INDEX "Vehicle_lat_lng_idx" ON "Vehicle"("lat", "lng");

-- CreateIndex
CREATE INDEX "Vehicle_type_idx" ON "Vehicle"("type");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "BookingSegment_bookingId_idx" ON "BookingSegment"("bookingId");

-- CreateIndex
CREATE INDEX "BookingSegment_mechanicId_idx" ON "BookingSegment"("mechanicId");

-- CreateIndex
CREATE INDEX "BookingSegment_status_idx" ON "BookingSegment"("status");

-- CreateIndex
CREATE INDEX "EVMetric_vehicleId_idx" ON "EVMetric"("vehicleId");

-- CreateIndex
CREATE INDEX "EVMetric_timestamp_idx" ON "EVMetric"("timestamp");

-- CreateIndex
CREATE INDEX "OrgMember_orgId_idx" ON "OrgMember"("orgId");

-- CreateIndex
CREATE INDEX "OrgMember_userId_idx" ON "OrgMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMember_orgId_userId_key" ON "OrgMember"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationWallet_orgId_key" ON "OrganizationWallet"("orgId");

-- CreateIndex
CREATE INDEX "OrganizationWallet_orgId_idx" ON "OrganizationWallet"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_bookingId_key" ON "Dispatch"("bookingId");

-- CreateIndex
CREATE INDEX "Dispatch_mechanicId_idx" ON "Dispatch"("mechanicId");

-- CreateIndex
CREATE INDEX "Dispatch_status_idx" ON "Dispatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SlaRecord_bookingId_key" ON "SlaRecord"("bookingId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "ChatRoom_bookingSegmentId_idx" ON "ChatRoom"("bookingSegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_customerId_mechanicId_bookingSegmentId_key" ON "ChatRoom"("customerId", "mechanicId", "bookingSegmentId");

-- CreateIndex
CREATE INDEX "Dispute_bookingSegmentId_idx" ON "Dispute"("bookingSegmentId");

-- CreateIndex
CREATE INDEX "Dispute_tenantId_idx" ON "Dispute"("tenantId");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_bookingSegmentId_idx" ON "Payment"("bookingSegmentId");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_orgWalletId_idx" ON "WalletTransaction"("orgWalletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_bookingId_idx" ON "WalletTransaction"("bookingId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EVMetric" ADD CONSTRAINT "EVMetric_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_bookingSegmentId_fkey" FOREIGN KEY ("bookingSegmentId") REFERENCES "BookingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingSegmentId_fkey" FOREIGN KEY ("bookingSegmentId") REFERENCES "BookingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_orgWalletId_fkey" FOREIGN KEY ("orgWalletId") REFERENCES "OrganizationWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationWallet" ADD CONSTRAINT "OrganizationWallet_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingSegmentId_fkey" FOREIGN KEY ("bookingSegmentId") REFERENCES "BookingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaRecord" ADD CONSTRAINT "SlaRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
