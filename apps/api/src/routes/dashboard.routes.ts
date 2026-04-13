import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;

  const [listings, offersReceived, offersMade, conversations] = await Promise.all([
    prisma.listing.findMany({
      where: { ownerId: userId },
      include: {
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offer.findMany({
      where: { listing: { ownerId: userId } },
      include: {
        listing: { select: { id: true, title: true, ownerId: true } },
        buyer: { select: { id: true, name: true } },
        escrow: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offer.findMany({
      where: { buyerId: userId },
      include: {
        listing: { select: { id: true, title: true, ownerId: true } },
        escrow: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversation.count({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    }),
  ]);

  return res.json({
    stats: {
      activeListings: listings.filter((l: { status: string }) => l.status === "ACTIVE").length,
      totalListingViewsProxy: listings.reduce(
        (acc: number, l: { _count: { offers: number } }) => acc + l._count.offers,
        0,
      ),
      offersReceived: offersReceived.length,
      offersMade: offersMade.length,
      openConversations: conversations,
    },
    listings,
    offersReceived,
    offersMade,
  });
});

export default router;
