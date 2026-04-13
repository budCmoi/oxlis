import { Router } from "express";
import { z } from "zod";
import { emitToUsers, isUserOnline, registerRealtimeClient, unregisterRealtimeClient } from "../lib/realtime";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

const createConversationSchema = z.object({
  listingId: z.string().optional(),
  recipientId: z.string().min(5),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
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
    },
  },
} as const;

const messageInclude = {
  sender: { select: { id: true, name: true } },
} as const;

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

  return res.json(messages);
});

router.post("/conversations/:id/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

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

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: req.user!.userId,
      content: parsed.data.content,
    },
    include: messageInclude,
  });

  emitToUsers([conversation.buyer.id, conversation.seller.id], "message:new", {
    conversationId: conversation.id,
    message,
  });

  return res.status(201).json(message);
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
