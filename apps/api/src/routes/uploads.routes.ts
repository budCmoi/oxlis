import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import {
  MAX_LISTING_IMAGE_BYTES,
  MAX_LISTING_IMAGES,
  buildListingImageUrl,
  hashListingImageContent,
  isSupportedListingImageMimeType,
  sanitizeListingImageName,
} from "../lib/listing-images";
import { requireAuth } from "../middleware/auth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_LISTING_IMAGES,
    fileSize: MAX_LISTING_IMAGE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (isSupportedListingImageMimeType(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Seuls les fichiers image sont acceptes."));
  },
});

router.get("/listing-images/:assetId", async (req, res) => {
  const assetId = String(req.params.assetId);
  const asset = await prisma.listingImageAsset.findUnique({ where: { id: assetId } });

  if (!asset) {
    return res.status(404).json({ message: "Image introuvable" });
  }

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Content-Type", asset.mimeType);
  res.setHeader("Content-Length", String(asset.sizeBytes));
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(asset.fileName)}`);
  res.setHeader("X-Content-Type-Options", "nosniff");

  return res.end(Buffer.from(asset.blob));
});

router.post("/listing-images", requireAuth, (req, res) => {
  upload.array("images", MAX_LISTING_IMAGES)(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || "Echec de l'upload des images" });
    }

    const files = ((req as typeof req & { files?: Express.Multer.File[] }).files ?? []) as Express.Multer.File[];

    if (files.length === 0) {
      return res.status(400).json({ message: "Ajoutez au moins une image." });
    }

    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const assets = await Promise.all(
        files.map((file) =>
          prisma.listingImageAsset.create({
            data: {
              ownerId: (req as typeof req & { user?: { userId: string } }).user!.userId,
              fileName: sanitizeListingImageName(file.originalname),
              mimeType: file.mimetype,
              sizeBytes: file.size,
              blob: file.buffer,
              contentSha256: hashListingImageContent(file.buffer),
            },
          }),
        ),
      );

      const urls = assets.map((asset) => buildListingImageUrl(baseUrl, asset.id));

      return res.status(201).json({ urls });
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        return res.status(500).json({ message: error.message.trim() });
      }

      return res.status(500).json({ message: "Impossible d'enregistrer les images en base" });
    }
  });
});

export default router;