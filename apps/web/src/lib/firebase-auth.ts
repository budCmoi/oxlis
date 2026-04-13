"use client";

import { FirebaseError, initializeApp, getApp, getApps, type FirebaseOptions } from "firebase/app";
import { GoogleAuthProvider, OAuthProvider, getAuth, signInWithPopup, signOut } from "firebase/auth";

type SocialAuthPayload = {
  idToken: string;
  email: string | null;
  name: string | null;
};

function getFirebaseConfig(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

function getFirebaseApp() {
  const config = getFirebaseConfig();
  if (!config) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(config);
}

function mapFirebaseAuthError(error: unknown, providerLabel: "Google" | "Apple") {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/popup-closed-by-user") {
      return new Error(`La fenetre ${providerLabel} a ete fermee avant la fin de la connexion`);
    }

    if (error.code === "auth/popup-blocked") {
      return new Error(`Le navigateur a bloque la fenetre ${providerLabel}. Autorisez les popups puis recommencez.`);
    }

    if (error.code === "auth/unauthorized-domain") {
      return new Error(`Le domaine actuel n'est pas autorise pour la connexion ${providerLabel}`);
    }

    if (error.code === "auth/operation-not-allowed") {
      return new Error(`La connexion ${providerLabel} n'est pas activee pour ce projet Firebase`);
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return new Error(error.message.trim());
  }

  return new Error(`Connexion ${providerLabel} impossible`);
}

export function isGoogleAuthConfigured() {
  return Boolean(getFirebaseConfig());
}

async function signInWithProviderPopup(
  providerLabel: "Google" | "Apple",
  provider: GoogleAuthProvider | OAuthProvider,
): Promise<SocialAuthPayload> {
  const app = getFirebaseApp();

  if (!app) {
    throw new Error("La connexion sociale n'est pas configuree sur ce site");
  }

  const auth = getAuth(app);

  try {
    const result = await signInWithPopup(auth, provider);

    return {
      idToken: await result.user.getIdToken(),
      email: result.user.email,
      name: result.user.displayName,
    };
  } catch (error) {
    throw mapFirebaseAuthError(error, providerLabel);
  } finally {
    await signOut(auth).catch(() => undefined);
  }
}

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithProviderPopup("Google", provider);
}

export async function signInWithApplePopup() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return signInWithProviderPopup("Apple", provider);
}