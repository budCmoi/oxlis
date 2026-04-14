"use client";

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
  return Boolean(getGoogleClientId());
}

export function isAppleAuthConfigured() {
  return Boolean(getAppleClientId());
}

export async function signInWithGooglePopup(): Promise<SocialAuthPayload> {
  return signInWithGooglePopupDirect();
}

export async function signInWithApplePopup(): Promise<SocialAuthPayload> {
  return signInWithApplePopupDirect();
}