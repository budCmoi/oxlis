-- AlterTable
ALTER TABLE "public"."Message"
ADD COLUMN "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Message_conversationId_senderId_readAt_idx"
ON "public"."Message"("conversationId", "senderId", "readAt");