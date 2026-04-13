import { env } from "../config/env";

const firebaseIssuer = () => `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
const firebaseJwksUrl = new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");

type SupportedFirebaseProvider = "google.com" | "apple.com";

type VerifiedSocialIdentity = {
  uid: string;
  email: string;
  name: string;
};

let firebaseJwksFactoryPromise: Promise<ReturnType<typeof import("jose")["createRemoteJWKSet"]>> | null = null;

async function getFirebaseJwksFactory() {
  if (!firebaseJwksFactoryPromise) {
    firebaseJwksFactoryPromise = import("jose").then(({ createRemoteJWKSet }) => createRemoteJWKSet(firebaseJwksUrl));
  }

  return firebaseJwksFactoryPromise;
}

export async function verifyFirebaseSocialToken(
  idToken: string,
  expectedProvider: SupportedFirebaseProvider,
): Promise<VerifiedSocialIdentity> {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new Error("La connexion sociale n'est pas configuree sur le serveur");
  }

  const { jwtVerify } = await import("jose");
  const jwks = await getFirebaseJwksFactory();
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: firebaseIssuer(),
    audience: env.FIREBASE_PROJECT_ID,
  });

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const uid = typeof payload.user_id === "string" ? payload.user_id : typeof payload.sub === "string" ? payload.sub : "";
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0] ?? "Utilisateur Google";
  const emailVerified = payload.email_verified === true;
  const firebasePayload = typeof payload.firebase === "object" && payload.firebase !== null ? payload.firebase : null;
  const providerId =
    firebasePayload && typeof (firebasePayload as Record<string, unknown>).sign_in_provider === "string"
      ? String((firebasePayload as Record<string, unknown>).sign_in_provider)
      : "";

  if (!uid || !email) {
    throw new Error("Le jeton social ne contient pas d'identite exploitable");
  }

  if (!emailVerified) {
    throw new Error("Le compte social doit avoir une adresse e-mail verifiee");
  }

  if (providerId !== expectedProvider) {
    throw new Error(expectedProvider === "google.com" ? "Ce jeton n'est pas issu d'une connexion Google" : "Ce jeton n'est pas issu d'une connexion Apple");
  }

  return {
    uid,
    email,
    name,
  };
}