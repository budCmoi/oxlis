-- CreateEnum
CREATE TYPE "public"."MessageAttachmentCategory" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Message"
ALTER COLUMN "content" SET DEFAULT '';

-- CreateTable
CREATE TABLE "public"."MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "category" "public"."MessageAttachmentCategory" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "algorithm" TEXT NOT NULL,
    "iv" BYTEA NOT NULL,
    "authTag" BYTEA NOT NULL,
    "blob" BYTEA NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_createdAt_idx"
ON "public"."MessageAttachment"("messageId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment"
ADD CONSTRAINT "MessageAttachment_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;