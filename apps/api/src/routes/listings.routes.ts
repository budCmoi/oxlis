import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

const imageUrlSchema = z.string().trim().min(1).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
  message: "Chaque image doit etre un chemin /public ou une URL http(s)",
});

const listingSchema = z.object({
  title: z.string().min(4),
  summary: z.string().min(10),
  description: z.string().min(30),
  imageUrls: z.array(imageUrlSchema).max(10).optional(),
  niche: z.string().min(2),
  type: z.string().min(2),
  askingPrice: z.number().positive(),
  monthlyRevenue: z.number().nonnegative(),
  monthlyProfit: z.number().nonnegative(),
  techStack: z.array(z.string().min(1)).min(1),
  status: z.enum(["ACTIVE", "SOLD", "DRAFT"]).optional(),
});

router.get("/", async (req, res) => {
  const priceMin = req.query.priceMin ? Number(req.query.priceMin) : undefined;
  const priceMax = req.query.priceMax ? Number(req.query.priceMax) : undefined;
  const niche = req.query.niche?.toString();
  const type = req.query.type?.toString();

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      askingPrice: {
        gte: Number.isFinite(priceMin) ? priceMin : undefined,
        lte: Number.isFinite(priceMax) ? priceMax : undefined,
      },
      niche: niche ? { equals: niche, mode: "insensitive" } : undefined,
      type: type ? { equals: type, mode: "insensitive" } : undefined,
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { offers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(listings);
});

router.get("/:id", async (req, res) => {
  const id = String(req.params.id);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      offers: {
        include: { buyer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!listing) {
    return res.status(404).json({ message: "Annonce introuvable" });
  }

  return res.json({
    ...listing,
    metrics: {
      margin: listing.monthlyRevenue > 0 ? (listing.monthlyProfit / listing.monthlyRevenue) * 100 : 0,
      annualProfit: listing.monthlyProfit * 12,
      annualRevenue: listing.monthlyRevenue * 12,
    },
  });
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  const listing = await prisma.listing.create({
    data: {
      ...parsed.data,
      imageUrls: parsed.data.imageUrls ?? [],
      status: parsed.data.status ?? "ACTIVE",
      ownerId: req.user!.userId,
    },
  });

  return res.status(201).json(listing);
});

router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Annonce introuvable" });
  }

  if (existing.ownerId !== req.user!.userId) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...parsed.data,
      imageUrls: parsed.data.imageUrls ?? existing.imageUrls,
      status: parsed.data.status ?? existing.status,
    },
  });

  return res.json(listing);
});

router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Annonce introuvable" });
  }

  if (existing.ownerId !== req.user!.userId) {
    return res.status(403).json({ message: "Action non autorisee" });
  }

  await prisma.listing.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
