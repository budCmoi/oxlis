import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";

const router = Router();

const uploadDirectory = path.resolve(__dirname, "../../uploads/listings");
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadDirectory);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || ".bin";
      const baseName = path
        .basename(file.originalname, extension)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "listing-image";

      callback(null, `${Date.now()}-${baseName}${extension}`);
    },
  }),
  limits: {
    files: 8,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }

    callback(new Error("Seuls les fichiers image sont acceptes."));
  },
});

router.post("/listing-images", requireAuth, (req, res) => {
  upload.array("images", 8)(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || "Echec de l'upload des images" });
    }

    const files = ((req as typeof req & { files?: Express.Multer.File[] }).files ?? []) as Express.Multer.File[];

    if (files.length === 0) {
      return res.status(400).json({ message: "Ajoutez au moins une image." });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = files.map((file) => `${baseUrl}/uploads/listings/${file.filename}`);

    return res.status(201).json({ urls });
  });
});

export default router;