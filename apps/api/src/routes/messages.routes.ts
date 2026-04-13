import multer from "multer";
import { Response, Router } from "express";
import { z } from "zod";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  decryptMessageAttachment,
  encryptMessageAttachment,
  resolveMessageAttachmentType,
  sanitizeMessageAttachmentName,
} from "../lib/message-attachments";
import { emitToUsers, isUserOnline, registerRealtimeClient, unregisterRealtimeClient } from "../lib/realtime";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

const createConversationSchema = z.object({
  listingId: z.string().optional(),
  recipientId: z.string().min(5),
});

const sendMessageSchema = z.object({
  content: z.string().trim().max(1000).optional(),
});

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_ATTACHMENTS_PER_MESSAGE,
    fileSize: MAX_ATTACHMENT_BYTES,
  },
  fileFilter(_req, file, callback) {
    if (!resolveMessageAttachmentType(file.mimetype, file.originalname)) {
      callback(new Error("Type de piece jointe non pris en charge"));
      return;
    }

    callback(null, true);
  },
});

const conversationParticipants = {
  buyer: { select: { id: true, name: true } },
  seller: { select: { id: true, name: true } },
  listing: { select: { id: true, title: true } },
} as const;

const conversationPreviewInclude = {
  ...conversationParticipants,
  messages: {
    take: 1,
    orderBy: { createdAt: "desc" as const },
    include: {
      sender: { select: { id: true, name: true } },
      attachments: {
        select: {
          id: true,
          category: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
} as const;

const messageInclude = {
  sender: { select: { id: true, name: true } },
  attachments: {
    select: {
      id: true,
      category: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

type MultipartMessageRequest = AuthenticatedRequest & {
  body: {
    content?: string;
  };
  files?: Express.Multer.File[];
};

function isMultipartRequest(req: AuthenticatedRequest) {
  return req.headers["content-type"]?.toLowerCase().includes("multipart/form-data") ?? false;
}

function formatUploadError(error: unknown) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return `Chaque piece jointe est limitee a ${Math.floor(MAX_ATTACHMENT_BYTES / (1024 * 1024))} Mo.`;
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return `Maximum ${MAX_ATTACHMENTS_PER_MESSAGE} pieces jointes par message.`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Impossible de traiter les pieces jointes";
}

async function parseMessageAttachments(req: MultipartMessageRequest, res: Response) {
  if (!isMultipartRequest(req)) {
    return [];
  }

  return new Promise<Express.Multer.File[]>((resolve, reject) => {
    attachmentUpload.array("attachments", MAX_ATTACHMENTS_PER_MESSAGE)(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(Array.isArray(req.files) ? req.files : []);
    });
  });
}

function serializeAttachment(attachment: {
  id: string;
  category: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}) {
  return {
    ...attachment,
    downloadUrl: `/messages/attachments/${attachment.id}`,
  };
}

function serializeMessage<T extends { attachments: Array<Parameters<typeof serializeAttachment>[0]> }>(message: T) {
  return {
    ...message,
    attachments: message.attachments.map(serializeAttachment),
  };
}

function sortConversationsByActivity<T extends { createdAt: Date; messages: Array<{ createdAt: Date }> }>(conversations: T[]) {
  return [...conversations].sort((left, right) => {
    const rightActivity = right.messages[0]?.createdAt ?? right.createdAt;
    const leftActivity = left.messages[0]?.createdAt ?? left.createdAt;
    return rightActivity.getTime() - leftActivity.getTime();
  });
}

function withPresence<T extends { buyer: { id: string; name: string }; seller: { id: string; name: string } }>(conversation: T) {
  return {
    ...conversation,
    buyer: { ...conversation.buyer, online: isUserOnline(conversation.buyer.id) },
    seller: { ...conversation.seller, online: isUserOnline(conversation.seller.id) },
  };
}

async function buildUnreadCounts(userId: string, conversationIds: string[]) {
  if (conversationIds.length === 0) {
    return new Map<string, number>();
  }

  const unreadGroups = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { _all: true },
  });

  return new Map(unreadGroups.map((group) => [group.conversationId, group._count._all]));
}

router.get("/attachments/:attachmentId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const attachmentId = String(req.params.attachmentId);
  const attachment = await prisma.messageAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      message: {
        select: {
          conversation: {
            select: {
              buyerId: true,
              sellerId: true,
            },
          },
        },
      },
    },
  });

  if (!attachment) {
    return res.status(404).json({ message: "Piece jointe introuvable" });
  }

  const isParticipant =
    attachment.message.conversation.buyerId === req.user!.userId || attachment.message.conversation.sellerId === req.user!.userId;

  if (!isParticipant) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  try {
    const payload = decryptMessageAttachment({
      algorithm: attachment.algorithm,
      blob: Buffer.from(attachment.blob),
      iv: Buffer.from(attachment.iv),
      authTag: Buffer.from(attachment.authTag),
    });
    const shouldDownload = req.query.download === "1";

    res.setHeader("Cache-Control", "private, max-age=120");
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Length", String(attachment.sizeBytes));
    res.setHeader(
      "Content-Disposition",
      `${shouldDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.end(payload);
  } catch {
    return res.status(500).json({ message: "Impossible de lire la piece jointe" });
  }
});

router.get("/stream", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const connectionId = await registerRealtimeClient(userId, res);

  req.on("close", () => {
    void unregisterRealtimeClient(userId, connectionId);
  });
});

router.get("/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: req.user!.userId }, { sellerId: req.user!.userId }],
    },
    include: conversationPreviewInclude,
  });

  const unreadCounts = await buildUnreadCounts(
    req.user!.userId,
    conversations.map((conversation) => conversation.id),
  );

  const payload = sortConversationsByActivity(conversations).map((conversation) => ({
    ...withPresence(conversation),
    unreadCount: unreadCounts.get(conversation.id) ?? 0,
    messages: conversation.messages.map(serializeMessage),
  }));

  return res.json(payload);
});

router.post("/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  const { listingId, recipientId } = parsed.data;

  const listing = listingId ? await prisma.listing.findUnique({ where: { id: listingId } }) : null;
  const sellerId = listing ? listing.ownerId : recipientId;
  const buyerId = req.user!.userId === sellerId ? recipientId : req.user!.userId;

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      buyerId,
      sellerId,
      listingId: listingId ?? undefined,
    },
    include: conversationParticipants,
  });

  const conversation =
    existingConversation ??
    (await prisma.conversation.create({
      data: {
        buyerId,
        sellerId,
        listingId: listingId ?? undefined,
      },
      include: conversationParticipants,
    }));

  return res.status(201).json({
    ...withPresence(conversation),
    messages: [],
    unreadCount: 0,
  });
});

router.delete("/conversations/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
    },
  });

  if (!conversation) {
    return res.status(404).json({ message: "Conversation introuvable" });
  }

  if (conversation.buyerId !== req.user!.userId && conversation.sellerId !== req.user!.userId) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({
      where: { conversationId: id },
    });

    await tx.conversation.delete({
      where: { id },
    });
  });

  const payload = { conversationId: id };

  emitToUsers([conversation.buyerId, conversation.sellerId], "conversation:deleted", payload);

  return res.json(payload);
});

router.get("/conversations/:id/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return res.status(404).json({ message: "Conversation introuvable" });
  }

  if (conversation.buyerId !== req.user!.userId && conversation.sellerId !== req.user!.userId) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  });

  return res.json(messages.map(serializeMessage));
});

router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  const request = req as MultipartMessageRequest;
  const id = String(req.params.id);

  let files: Express.Multer.File[] = [];
  try {
    files = await parseMessageAttachments(request, res);
  } catch (error) {
    return res.status(400).json({ message: formatUploadError(error) });
  }

  const parsed = sendMessageSchema.safeParse({
    content: typeof request.body?.content === "string" ? request.body.content : undefined,
  });
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  const content = parsed.data.content?.trim() ?? "";

  if (!content && files.length === 0) {
    return res.status(400).json({ message: "Ajoutez un message ou au moins une piece jointe" });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: conversationParticipants,
  });
  if (!conversation) {
    return res.status(404).json({ message: "Conversation introuvable" });
  }

  if (conversation.buyerId !== request.user!.userId && conversation.sellerId !== request.user!.userId) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  const attachmentInputs = files.map((file) => {
    const resolvedType = resolveMessageAttachmentType(file.mimetype, file.originalname);
    if (!resolvedType) {
      throw new Error("Type de piece jointe non pris en charge");
    }

    const encryptedPayload = encryptMessageAttachment(file.buffer);

    return {
      category: resolvedType.category,
      fileName: sanitizeMessageAttachmentName(file.originalname),
      mimeType: resolvedType.mimeType,
      sizeBytes: file.size,
      algorithm: encryptedPayload.algorithm,
      iv: encryptedPayload.iv,
      authTag: encryptedPayload.authTag,
      blob: encryptedPayload.blob,
      contentSha256: encryptedPayload.contentSha256,
    };
  });

  let message;
  try {
    message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: request.user!.userId,
        content,
        ...(attachmentInputs.length > 0
          ? {
              attachments: {
                create: attachmentInputs,
              },
            }
          : {}),
      },
      include: messageInclude,
    });
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      return res.status(500).json({ message: error.message.trim() });
    }

    return res.status(500).json({ message: "Impossible d'envoyer le message" });
  }

  const payload = serializeMessage(message);

  emitToUsers([conversation.buyer.id, conversation.seller.id], "message:new", {
    conversationId: conversation.id,
    message: payload,
  });

  return res.status(201).json(payload);
});

router.post("/conversations/:id/read", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: conversationParticipants,
  });

  if (!conversation) {
    return res.status(404).json({ message: "Conversation introuvable" });
  }

  if (conversation.buyerId !== req.user!.userId && conversation.sellerId !== req.user!.userId) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  const unreadMessages = await prisma.message.findMany({
    where: {
      conversationId: id,
      senderId: { not: req.user!.userId },
      readAt: null,
    },
    select: { id: true },
  });

  if (unreadMessages.length === 0) {
    return res.json({
      conversationId: id,
      messageIds: [],
      readAt: null,
      readerId: req.user!.userId,
    });
  }

  const readAt = new Date();
  const messageIds = unreadMessages.map((message) => message.id);

  await prisma.message.updateMany({
    where: { id: { in: messageIds } },
    data: { readAt },
  });

  const payload = {
    conversationId: id,
    messageIds,
    readAt: readAt.toISOString(),
    readerId: req.user!.userId,
  };

  emitToUsers([conversation.buyer.id, conversation.seller.id], "conversation:read", payload);

  return res.json(payload);
});

export default router;
