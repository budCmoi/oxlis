import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

const createOfferSchema = z.object({
  listingId: z.string().min(5),
  amount: z.number().positive(),
  message: z.string().max(600).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "COUNTERED"]),
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = createOfferSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  const listing = await prisma.listing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing) {
    return res.status(404).json({ message: "Annonce introuvable" });
  }

  if (listing.ownerId === req.user!.userId) {
    return res.status(400).json({ message: "Impossible de faire une offre sur votre propre annonce" });
  }

  const offer = await prisma.offer.create({
    data: {
      listingId: parsed.data.listingId,
      amount: parsed.data.amount,
      message: parsed.data.message,
      buyerId: req.user!.userId,
    },
    include: {
      buyer: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true, ownerId: true } },
    },
  });

  return res.status(201).json(offer);
});

router.patch("/:id/status", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!offer) {
    return res.status(404).json({ message: "Offre introuvable" });
  }

  const isSeller = offer.listing.ownerId === req.user!.userId;
  const isBuyer = offer.buyerId === req.user!.userId;

  if (!isSeller && !isBuyer) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  if (!isSeller && parsed.data.status === "ACCEPTED") {
    return res.status(403).json({ message: "Seul le vendeur peut accepter les offres" });
  }

  const updated = await prisma.offer.update({
    where: { id },
    data: { status: parsed.data.status },
    include: {
      buyer: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true, ownerId: true } },
      escrow: true,
    },
  });

  if (updated.status === "ACCEPTED" && !updated.escrow) {
    await prisma.escrowTransaction.create({
      data: {
        offerId: updated.id,
        amount: updated.amount,
        status: "INITIATED",
      },
    });
  }

  return res.json(updated);
});

export default router;
