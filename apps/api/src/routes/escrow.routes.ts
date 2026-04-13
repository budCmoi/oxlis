import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

router.get("/offers/:offerId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const offerId = String(req.params.offerId);
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { offerId },
    include: {
      offer: {
        include: {
          listing: { select: { ownerId: true, title: true } },
          buyer: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!escrow) {
    return res.status(404).json({ message: "Sequestre introuvable" });
  }

  const userId = req.user!.userId;
  const canAccess = escrow.offer.buyerId === userId || escrow.offer.listing.ownerId === userId;

  if (!canAccess) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  return res.json(escrow);
});

router.post("/offers/:offerId/fund", requireAuth, async (req: AuthenticatedRequest, res) => {
  const offerId = String(req.params.offerId);
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: true, escrow: true },
  });

  if (!offer || !offer.escrow) {
    return res.status(404).json({ message: "Transaction de sequestre introuvable" });
  }

  if (offer.buyerId !== req.user!.userId) {
    return res.status(403).json({ message: "Seul l'acheteur peut financer le sequestre" });
  }

  const escrow = await prisma.escrowTransaction.update({
    where: { offerId: offer.id },
    data: { status: "FUNDED" },
  });

  return res.json(escrow);
});

router.post("/offers/:offerId/release", requireAuth, async (req: AuthenticatedRequest, res) => {
  const offerId = String(req.params.offerId);
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: true, escrow: true },
  });

  if (!offer || !offer.escrow) {
    return res.status(404).json({ message: "Transaction de sequestre introuvable" });
  }

  if (offer.listing.ownerId !== req.user!.userId) {
    return res.status(403).json({ message: "Seul le vendeur peut liberer le sequestre" });
  }

  const escrow = await prisma.escrowTransaction.update({
    where: { offerId: offer.id },
    data: { status: "RELEASED" },
  });

  await prisma.listing.update({
    where: { id: offer.listingId },
    data: { status: "SOLD" },
  });

  return res.json(escrow);
});

export default router;
