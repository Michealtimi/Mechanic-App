-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "certificationUrls" TEXT[],
ADD COLUMN     "experienceYears" INTEGER,
ADD COLUMN     "profilePictureUrl" TEXT;
