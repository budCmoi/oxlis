import bcrypt from "bcryptjs";
import { Prisma, SocialAuthProvider } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { verifyGoogleSignIn } from "../lib/social-auth";
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

const googleLoginSchema = z
  .object({
    accessToken: z.string().min(1).optional(),
    idToken: z.string().min(1).optional(),
    role: z.enum(["BUYER", "SELLER", "BOTH"]).optional(),
    name: z.string().trim().min(2).max(120).optional(),
  })
  .refine((payload) => Boolean(payload.accessToken?.trim() || payload.idToken?.trim()), {
    message: "Un jeton Google est requis",
    path: ["accessToken"],
  });

const issueToken = (user: { id: string; email: string }) =>
  jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

const serializeUser = (user: { id: string; name: string; email: string; role: "BUYER" | "SELLER" | "BOTH" }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

function isSocialOnlyPassword(passwordHash: string) {
  return passwordHash.startsWith("oauth:");
}

function buildSocialOnlyPasswordMarker() {
  return "oauth:social-only";
}

function buildSocialLoginMessage(accounts: Array<{ provider: SocialAuthProvider }>) {
  const hasGoogle = accounts.some((account) => account.provider === SocialAuthProvider.GOOGLE);
  const hasApple = accounts.some((account) => account.provider === SocialAuthProvider.APPLE);

  if (hasGoogle) {
    return "Ce compte utilise Google. Utilisez Continuer avec Google.";
  }

  if (hasApple) {
    return "Ce compte a ete cree avec Apple. Cette connexion n'est plus disponible sur OXLIS.";
  }

  if (accounts.length === 0) {
    return "Ce compte utilise une connexion sociale. Utilisez un fournisseur social pour vous connecter.";
  }

  return "Ce compte utilise une connexion sociale. Utilisez Continuer avec Google.";
}

async function completeGoogleLogin({
  providerUserId,
  email,
  identityName,
  role,
  name,
}: {
  providerUserId: string;
  email: string;
  identityName: string;
  role?: "BUYER" | "SELLER" | "BOTH";
  name?: string;
}) {
  const providerEnum = SocialAuthProvider.GOOGLE;
  const providerLabel = "Google";
  const socialAccount = await prisma.socialAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: providerEnum,
        providerUserId,
      },
    },
    include: {
      user: true,
    },
  });

  if (socialAccount) {
    const updatedUser =
      socialAccount.user.name !== (name?.trim() || identityName) && isSocialOnlyPassword(socialAccount.user.passwordHash)
        ? await prisma.user.update({
            where: { id: socialAccount.user.id },
            data: { name: name?.trim() || identityName },
          })
        : socialAccount.user;

    return {
      token: issueToken(updatedUser),
      user: serializeUser(updatedUser),
    };
  }

  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      socialAccounts: true,
    },
  });

  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          name: name?.trim() || identityName,
          email,
          passwordHash: buildSocialOnlyPasswordMarker(),
          role: role ?? "BOTH",
          socialAccounts: {
            create: {
              provider: providerEnum,
              providerUserId,
              email,
            },
          },
        },
        include: {
          socialAccounts: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        user = await prisma.user.findUnique({
          where: { email },
          include: {
            socialAccounts: true,
          },
        });
      } else {
        throw error;
      }
    }
  }

  if (!user) {
    throw new Error(`Impossible de finaliser la connexion ${providerLabel}`);
  }

  const existingProviderLink = user.socialAccounts.find((account) => account.provider === providerEnum);

  if (existingProviderLink && existingProviderLink.providerUserId !== providerUserId && existingProviderLink.email !== email) {
    throw new Error(`Ce compte est deja lie a un autre identifiant ${providerLabel}`);
  }

  await prisma.socialAccount.upsert({
    where: {
      userId_provider: {
        userId: user.id,
        provider: providerEnum,
      },
    },
    update: {
      providerUserId,
      email,
    },
    create: {
      userId: user.id,
      provider: providerEnum,
      providerUserId,
      email,
    },
  });

  if (isSocialOnlyPassword(user.passwordHash) && user.name !== (name?.trim() || identityName)) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name?.trim() || identityName,
      },
      include: {
        socialAccounts: true,
      },
    });
  }

  return {
    token: issueToken(user),
    user: serializeUser(user),
  };
}

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
      user: serializeUser(user),
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

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      socialAccounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "Aucun compte n'est associe a cet e-mail" });
  }

  if (isSocialOnlyPassword(user.passwordHash)) {
    return res.status(409).json({ message: buildSocialLoginMessage(user.socialAccounts) });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Mot de passe incorrect" });
  }

  return res.json({
    token: issueToken(user),
    user: serializeUser(user),
  });
});

router.post("/google", async (req, res) => {
  const parsed = googleLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Payload invalide", errors: parsed.error.issues });
  }

  try {
    const identity = await verifyGoogleSignIn({
      accessToken: parsed.data.accessToken,
      idToken: parsed.data.idToken,
    });

    return res.json(
      await completeGoogleLogin({
        providerUserId: identity.providerUserId,
        email: identity.email,
        identityName: identity.name,
        role: parsed.data.role,
        name: parsed.data.name,
      }),
    );
  } catch (error) {
    const message = error instanceof Error && error.message.trim() ? error.message.trim() : "Jeton Google invalide";
    const statusCode = message.includes("pas configuree") ? 503 : message.includes("deja lie") ? 409 : 401;
    return res.status(statusCode).json({ message });
  }
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  return res.json(serializeUser(user));
});

export default router;
