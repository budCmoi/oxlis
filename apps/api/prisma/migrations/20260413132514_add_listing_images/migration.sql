-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
