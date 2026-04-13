-- CreateTable
CREATE TABLE "public"."ListingImageAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "blob" BYTEA NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingImageAsset_ownerId_createdAt_idx"
ON "public"."ListingImageAsset"("ownerId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ListingImageAsset"
ADD CONSTRAINT "ListingImageAsset_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;