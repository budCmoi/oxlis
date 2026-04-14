"use client";

import { FirebaseError, getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { GoogleAuthProvider, OAuthProvider, getAuth, signInWithPopup, signOut } from "firebase/auth";

type SocialAuthPayload = {
  accessToken?: string;
  idToken?: string;
  email: string | null;
  name: string | null;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenError = {
  type?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

type AppleSignInResponse = {
  authorization?: {
    id_token?: string;
  };
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

type SocialWindow = Window & {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: GoogleTokenResponse) => void;
          error_callback?: (error: GoogleTokenError) => void;
          prompt?: string;
        }) => GoogleTokenClient;
      };
    };
  };
  AppleID?: {
    auth: {
      init: (config: {
        clientId: string;
        scope: string;
        redirectURI: string;
        usePopup: boolean;
      }) => void;
      signIn: () => Promise<AppleSignInResponse>;
    };
  };
};

const googleScriptUrl = "https://accounts.google.com/gsi/client";
const appleScriptUrl = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
const loadedScripts = new Map<string, Promise<void>>();

function loadScript(src: string) {
  const existing = loadedScripts.get(src);
  if (existing) {
    return existing;
  }

  const promise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Cette fonctionnalite n'est disponible que dans le navigateur"));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}

function getGoogleClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
}

function getFirebaseConfig(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
  };
}

function getFirebaseApp() {
  const config = getFirebaseConfig();

  if (!config) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(config);
}

function getAppleClientId() {
  return process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim() || "";
}

function getAppleRedirectUri() {
  if (process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI?.trim()) {
    return process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI.trim();
  }

  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/auth`;
}

function buildProviderError(providerLabel: "Google" | "Apple", message: string) {
  return new Error(`${providerLabel}: ${message}`);
}

function normalizeDisplayName(firstName?: string, lastName?: string) {
  return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ") || null;
}

function mapGoogleError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error;
  }

  const googleError = error as GoogleTokenError | undefined;

  if (googleError?.type === "popup_closed") {
    return buildProviderError("Google", "la fenetre a ete fermee avant la fin de la connexion");
  }

  if (googleError?.type === "popup_failed_to_open") {
    return buildProviderError("Google", "le navigateur a bloque la fenetre popup");
  }

  return buildProviderError("Google", "connexion impossible");
}

function mapFirebaseAuthError(error: unknown, providerLabel: "Google" | "Apple") {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/popup-closed-by-user") {
      return buildProviderError(providerLabel, "la fenetre a ete fermee avant la fin de la connexion");
    }

    if (error.code === "auth/popup-blocked") {
      return buildProviderError(providerLabel, "le navigateur a bloque la fenetre popup");
    }

    if (error.code === "auth/unauthorized-domain") {
      return buildProviderError(providerLabel, "le domaine actuel n'est pas autorise pour la connexion");
    }

    if (error.code === "auth/operation-not-allowed") {
      return buildProviderError(providerLabel, `la connexion ${providerLabel} n'est pas activee pour ce projet Firebase`);
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return buildProviderError(providerLabel, error.message.trim());
  }

  return buildProviderError(providerLabel, "connexion impossible");
}

function mapAppleError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error;
  }

  const payload = typeof error === "object" && error !== null ? (error as Record<string, unknown>) : null;
  const code = typeof payload?.error === "string" ? payload.error : "";

  if (code === "popup_closed_by_user") {
    return buildProviderError("Apple", "la fenetre a ete fermee avant la fin de la connexion");
  }

  return buildProviderError("Apple", "connexion impossible");
}

async function signInWithGooglePopupDirect(): Promise<SocialAuthPayload> {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new Error("La connexion Google n'est pas configuree sur ce site");
  }

  await loadScript(googleScriptUrl);

  const socialWindow = window as SocialWindow;
  const oauth2 = socialWindow.google?.accounts.oauth2;

  if (!oauth2) {
    throw buildProviderError("Google", "le script OAuth n'a pas pu etre initialise");
  }

  return new Promise<SocialAuthPayload>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      prompt: "select_account",
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(buildProviderError("Google", response.error_description || response.error || "connexion impossible"));
          return;
        }

        resolve({
          accessToken: response.access_token,
          email: null,
          name: null,
        });
      },
      error_callback: (error) => reject(mapGoogleError(error)),
    });

    try {
      client.requestAccessToken({ prompt: "select_account" });
    } catch (error) {
      reject(mapGoogleError(error));
    }
  });
}

async function signInWithGooglePopupViaFirebase(): Promise<SocialAuthPayload> {
  const app = getFirebaseApp();

  if (!app) {
    throw new Error("La connexion Google n'est pas configuree sur ce site");
  }

  const auth = getAuth(app);

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);

    return {
      idToken: await result.user.getIdToken(),
      email: result.user.email,
      name: result.user.displayName,
    };
  } catch (error) {
    throw mapFirebaseAuthError(error, "Google");
  } finally {
    await signOut(auth).catch(() => undefined);
  }
}

async function signInWithApplePopupViaFirebase(): Promise<SocialAuthPayload> {
  const app = getFirebaseApp();

  if (!app) {
    throw new Error("La connexion Apple n'est pas configuree sur ce site");
  }

  const auth = getAuth(app);
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");

  try {
    const result = await signInWithPopup(auth, provider);

    return {
      idToken: await result.user.getIdToken(),
      email: result.user.email,
      name: result.user.displayName,
    };
  } catch (error) {
    throw mapFirebaseAuthError(error, "Apple");
  } finally {
    await signOut(auth).catch(() => undefined);
  }
}

async function signInWithApplePopupDirect(): Promise<SocialAuthPayload> {
  const clientId = getAppleClientId();
  const redirectUri = getAppleRedirectUri();

  if (!clientId || !redirectUri) {
    throw new Error("La connexion Apple n'est pas configuree sur ce site");
  }

  await loadScript(appleScriptUrl);

  const socialWindow = window as SocialWindow;
  const appleAuth = socialWindow.AppleID?.auth;

  if (!appleAuth) {
    throw buildProviderError("Apple", "le script OAuth n'a pas pu etre initialise");
  }

  appleAuth.init({
    clientId,
    scope: "name email",
    redirectURI: redirectUri,
    usePopup: true,
  });

  try {
    const response = await appleAuth.signIn();
    const idToken = response.authorization?.id_token;

    if (!idToken) {
      throw buildProviderError("Apple", "aucun jeton d'identite n'a ete retourne");
    }

    return {
      idToken,
      email: response.user?.email ?? null,
      name: normalizeDisplayName(response.user?.name?.firstName, response.user?.name?.lastName),
    };
  } catch (error) {
    throw mapAppleError(error);
  }
}

export function isGoogleAuthConfigured() {
  return Boolean(getGoogleClientId() || getFirebaseConfig());
}

export function isAppleAuthConfigured() {
  return Boolean(getAppleClientId() || getFirebaseConfig());
}

export async function signInWithGooglePopup(): Promise<SocialAuthPayload> {
  if (getGoogleClientId()) {
    return signInWithGooglePopupDirect();
  }

  return signInWithGooglePopupViaFirebase();
}

export async function signInWithApplePopup(): Promise<SocialAuthPayload> {
  if (getAppleClientId()) {
    return signInWithApplePopupDirect();
  }

  return signInWithApplePopupViaFirebase();
}