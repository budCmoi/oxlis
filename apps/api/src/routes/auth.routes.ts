import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["BUYER", "SELLER", "BOTH"]).default("BOTH"),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const issueToken = (user: { id: string; email: string }) =>
  jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const { password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Cet e-mail est deja utilise" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    return res.status(201).json({
      token: issueToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ message: "Cet e-mail est deja utilise" });
    }

    throw error;
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ message: "Aucun compte n'est associe a cet e-mail" });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Mot de passe incorrect" });
  }

  return res.json({
    token: issueToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;
