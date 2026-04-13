import { Router } from "express";
import { z } from "zod";
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

router.get("/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: req.user!.userId }, { sellerId: req.user!.userId }],
    },
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(conversations);
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
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  const conversation =
    existingConversation ??
    (await prisma.conversation.create({
      data: {
        buyerId,
        sellerId,
        listingId: listingId ?? undefined,
      },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
      },
    }));

  return res.status(201).json(conversation);
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
    include: { sender: { select: { id: true, name: true } } },
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

  const conversation = await prisma.conversation.findUnique({ where: { id } });
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
    include: { sender: { select: { id: true, name: true } } },
  });

  return res.status(201).json(message);
});

export default router;
