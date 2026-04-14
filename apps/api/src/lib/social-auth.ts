import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";

export type SocialProvider = "google" | "apple";

export type VerifiedSocialIdentity = {
  provider: SocialProvider;
  providerUserId: string;
  email: string;
  name: string;
};

type SupportedFirebaseProvider = "google.com" | "apple.com";

type GoogleTokenInfoResponse = {
  aud?: string;
  issued_to?: string;
  user_id?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  verified_email?: string | boolean;
  name?: string;
};

type GoogleUserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

const firebaseJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function getFirebaseIssuer(projectId: string) {
  return `https://securetoken.google.com/${projectId}`;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function parseBooleanLike(value: unknown) {
  return value === true || value === "true";
}

function buildDefaultName(email: string, fallback: string) {
  const candidate = email.split("@")[0]?.trim();
  return candidate || fallback;
}

function getObjectRecord(value: unknown) {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function getJwtPayload(idToken: string) {
  const [, encodedPayload] = idToken.split(".");

  if (!encodedPayload) {
    throw new Error("Jeton social invalide");
  }

  const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const json = Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");

  return JSON.parse(json) as Record<string, unknown>;
}

export function detectIdentityTokenIssuer(idToken: string) {
  try {
    const payload = getJwtPayload(idToken);
    return typeof payload.iss === "string" ? payload.iss : null;
  } catch {
    return null;
  }
}

async function fetchJson<T>(input: string | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`Le fournisseur social a repondu avec ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function verifyGoogleAccessToken(accessToken: string): Promise<VerifiedSocialIdentity> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("La connexion Google n'est pas configuree sur le serveur");
  }

  const tokenInfo = await fetchJson<GoogleTokenInfoResponse>(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
  ).catch(() => {
    throw new Error("Jeton Google invalide");
  });

  const audience = typeof tokenInfo.aud === "string" && tokenInfo.aud.trim()
    ? tokenInfo.aud.trim()
    : typeof tokenInfo.issued_to === "string"
      ? tokenInfo.issued_to.trim()
      : "";

  if (audience !== env.GOOGLE_CLIENT_ID) {
    throw new Error("Ce jeton Google n'est pas destine a cette application");
  }

  const email = normalizeEmail(tokenInfo.email);
  const providerUserId = typeof tokenInfo.user_id === "string" && tokenInfo.user_id.trim()
    ? tokenInfo.user_id.trim()
    : typeof tokenInfo.sub === "string"
      ? tokenInfo.sub.trim()
      : "";

  if (!email || !providerUserId) {
    throw new Error("Le jeton Google ne contient pas d'identite exploitable");
  }

  if (!parseBooleanLike(tokenInfo.email_verified) && !parseBooleanLike(tokenInfo.verified_email)) {
    throw new Error("Le compte Google doit avoir une adresse e-mail verifiee");
  }

  let name = typeof tokenInfo.name === "string" ? tokenInfo.name.trim() : "";

  if (!name) {
    const userInfo = await fetchJson<GoogleUserInfoResponse>("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch(() => null);

    if (userInfo && typeof userInfo.name === "string" && userInfo.name.trim()) {
      name = userInfo.name.trim();
    }
  }

  return {
    provider: "google",
    providerUserId,
    email,
    name: name || buildDefaultName(email, "Utilisateur Google"),
  };
}

function getFirebaseProviderLabel(provider: SupportedFirebaseProvider) {
  return provider === "google.com" ? "Google" : "Apple";
}

function getFirebaseProviderFallback(provider: SupportedFirebaseProvider) {
  return provider === "google.com" ? "Utilisateur Google" : "Utilisateur Apple";
}

async function verifyFirebaseIdentityToken(
  idToken: string,
  expectedProvider: SupportedFirebaseProvider,
): Promise<VerifiedSocialIdentity> {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new Error("La connexion sociale n'est pas configuree sur le serveur");
  }

  const { payload } = await jwtVerify(idToken, firebaseJwks, {
    issuer: getFirebaseIssuer(env.FIREBASE_PROJECT_ID),
    audience: env.FIREBASE_PROJECT_ID,
  }).catch(() => {
    throw new Error(`Jeton ${getFirebaseProviderLabel(expectedProvider)} invalide`);
  });

  const email = normalizeEmail(payload.email);
  const providerUserId = typeof payload.user_id === "string" && payload.user_id.trim()
    ? payload.user_id.trim()
    : typeof payload.sub === "string"
      ? payload.sub.trim()
      : "";

  if (!email || !providerUserId) {
    throw new Error("Le jeton Google ne contient pas d'identite exploitable");
  }

  if (!parseBooleanLike(payload.email_verified)) {
    throw new Error("Le compte Google doit avoir une adresse e-mail verifiee");
  }

  const firebasePayload = getObjectRecord(payload.firebase);
  const providerId = typeof firebasePayload?.sign_in_provider === "string" ? firebasePayload.sign_in_provider.trim() : "";

  if (providerId !== expectedProvider) {
    throw new Error(`Ce jeton n'est pas issu d'une connexion ${getFirebaseProviderLabel(expectedProvider)}`);
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  return {
    provider: expectedProvider === "google.com" ? "google" : "apple",
    providerUserId,
    email,
    name: name || buildDefaultName(email, getFirebaseProviderFallback(expectedProvider)),
  };
}

export async function verifyGoogleFirebaseToken(idToken: string): Promise<VerifiedSocialIdentity> {
  return verifyFirebaseIdentityToken(idToken, "google.com");
}

export async function verifyAppleFirebaseToken(idToken: string): Promise<VerifiedSocialIdentity> {
  return verifyFirebaseIdentityToken(idToken, "apple.com");
}

export async function verifyGoogleSignIn({
  accessToken,
  idToken,
}: {
  accessToken?: string;
  idToken?: string;
}): Promise<VerifiedSocialIdentity> {
  const normalizedAccessToken = accessToken?.trim() || "";

  if (normalizedAccessToken) {
    return verifyGoogleAccessToken(normalizedAccessToken);
  }

  const normalizedIdToken = idToken?.trim() || "";

  if (normalizedIdToken) {
    return verifyGoogleFirebaseToken(normalizedIdToken);
  }

  if (!env.GOOGLE_CLIENT_ID && !env.FIREBASE_PROJECT_ID) {
    throw new Error("La connexion Google n'est pas configuree sur le serveur");
  }

  throw new Error("Jeton Google invalide");
}

export async function verifyAppleIdentityToken(idToken: string): Promise<VerifiedSocialIdentity> {
  if (!env.APPLE_CLIENT_ID) {
    throw new Error("La connexion Apple n'est pas configuree sur le serveur");
  }

  const { payload } = await jwtVerify(idToken, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: env.APPLE_CLIENT_ID,
  }).catch(() => {
    throw new Error("Jeton Apple invalide");
  });

  const providerUserId = typeof payload.sub === "string" ? payload.sub.trim() : "";
  const email = normalizeEmail(payload.email);
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const emailVerified = parseBooleanLike(payload.email_verified);

  if (!providerUserId || !email) {
    throw new Error("Le jeton Apple ne contient pas d'identite exploitable");
  }

  if (!emailVerified) {
    throw new Error("Le compte Apple doit avoir une adresse e-mail verifiee");
  }

  return {
    provider: "apple",
    providerUserId,
    email,
    name: name || buildDefaultName(email, "Utilisateur Apple"),
  };
}

export async function verifyAppleSignIn(idToken: string): Promise<VerifiedSocialIdentity> {
  const normalizedIdToken = idToken.trim();
  const issuer = detectIdentityTokenIssuer(normalizedIdToken);

  if (issuer === "https://appleid.apple.com") {
    return verifyAppleIdentityToken(normalizedIdToken);
  }

  if (env.FIREBASE_PROJECT_ID) {
    return verifyAppleFirebaseToken(normalizedIdToken);
  }

  if (env.APPLE_CLIENT_ID) {
    return verifyAppleIdentityToken(normalizedIdToken);
  }

  throw new Error("La connexion Apple n'est pas configuree sur le serveur");
}