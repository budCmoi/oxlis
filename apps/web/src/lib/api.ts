const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const MEMORY_CACHE_TTL_MS = 15_000;

const httpStatusFallbackMessages: Record<number, string> = {
  400: "Requete invalide",
  401: "Authentification requise",
  403: "Acces refuse",
  404: "Service introuvable",
  409: "Conflit sur les donnees envoyees",
  422: "Donnees invalides",
  500: "Erreur interne du serveur",
  502: "Passerelle serveur indisponible",
  503: "Service temporairement indisponible",
  504: "Le serveur a mis trop de temps a repondre",
};

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inflightRequests = new Map<string, Promise<unknown>>();

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("oxlis_token");
};

const buildError = async (response: Response) => {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => ({ message: undefined }))) as {
      message?: string;
      errors?: Array<{ message?: string; path?: Array<string | number> }>;
    };

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      const details = payload.errors
        .map((issue) => {
          const path = issue.path?.length ? `${issue.path.join(".")} : ` : "";
          return `${path}${issue.message ?? "Champ invalide"}`;
        })
        .join(" | ");

      return new Error(`${payload.message ?? getHttpFallbackMessage(response)} : ${details}`);
    }

    if (payload.message?.trim()) {
      return new Error(payload.message.trim());
    }
  }

  const responseText = (await response.text().catch(() => "")).trim();

  if (responseText && !looksLikeHtml(responseText, contentType)) {
    return new Error(responseText);
  }

  return new Error(getHttpFallbackMessage(response));
};

function getHttpFallbackMessage(response: Response) {
  const baseMessage = httpStatusFallbackMessages[response.status] ?? `Erreur serveur (${response.status})`;
  return `${baseMessage}${response.statusText ? ` - ${response.statusText}` : ""}`;
}

function looksLikeHtml(value: string, contentType: string) {
  return contentType.includes("text/html") || /^<!doctype html>|^<html[\s>]/i.test(value);
}

function buildNetworkError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return new Error(`Impossible de joindre le serveur: ${error.message.trim()}`);
  }

  return new Error("Impossible de joindre le serveur. Verifiez la connexion ou la configuration de l'API.");
}

async function performFetch(input: RequestInfo | URL, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw buildNetworkError(error);
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  cache?: RequestCache;
  memoryCache?: boolean;
  revalidateMs?: number;
};

function buildCacheKey(path: string, options: RequestOptions, method: string) {
  const authScope = options.auth ? `auth:${getToken() ?? "anon"}` : "public";
  return `${method}:${authScope}:${path}`;
}

function getCachedValue<T>(cacheKey: string) {
  const cached = responseCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.value as T;
}

function setCachedValue(cacheKey: string, value: unknown, ttlMs: number) {
  responseCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function createAbortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

function withAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal) {
  if (!signal) {
    return promise;
  }

  if (signal.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(createAbortError());
    signal.addEventListener("abort", onAbort, { once: true });

    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

async function requestJson<T>(path: string, options: RequestOptions, method: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await performFetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
    signal: options.signal,
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

async function requestBlob(path: string, auth = false) {
  const headers: Record<string, string> = {};

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const targetUrl = path.startsWith("http://") || path.startsWith("https://") ? path : `${API_URL}${path}`;
  const response = await performFetch(targetUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  return response.blob();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const canUseMemoryCache = method === "GET" && !options.body && (options.memoryCache ?? true);

  if (canUseMemoryCache) {
    const cacheKey = buildCacheKey(path, options, method);
    const cachedValue = getCachedValue<T>(cacheKey);
    if (cachedValue !== null) {
      return cachedValue;
    }

    let request = inflightRequests.get(cacheKey) as Promise<T> | undefined;
    if (!request) {
      request = requestJson<T>(path, { ...options, signal: undefined }, method)
        .then((payload) => {
          setCachedValue(cacheKey, payload, options.revalidateMs ?? MEMORY_CACHE_TTL_MS);
          inflightRequests.delete(cacheKey);
          return payload;
        })
        .catch((error) => {
          inflightRequests.delete(cacheKey);
          throw error;
        });

      inflightRequests.set(cacheKey, request);
    }

    return withAbortSignal(request, options.signal);
  }

  const payload = await requestJson<T>(path, options, method);

  if (method !== "GET") {
    clearApiCache();
  }

  return payload;
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function clearApiCache() {
  responseCache.clear();
  inflightRequests.clear();
}

export async function uploadListingImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await performFetch(`${API_URL}/uploads/listing-images`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  const payload = (await response.json()) as { urls: string[] };
  return payload.urls;
}

export async function sendConversationMessage<T>({
  conversationId,
  content,
  attachments = [],
}: {
  conversationId: string;
  content: string;
  attachments?: File[];
}): Promise<T> {
  const trimmedContent = content.trim();

  if (attachments.length === 0) {
    return apiRequest<T>(`/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      auth: true,
      body: { content: trimmedContent },
    });
  }

  const formData = new FormData();
  if (trimmedContent) {
    formData.append("content", trimmedContent);
  }

  for (const attachment of attachments) {
    formData.append("attachments", attachment);
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await performFetch(`${API_URL}/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  clearApiCache();

  return response.json() as Promise<T>;
}

export function fetchProtectedBlob(path: string, options: { download?: boolean } = {}) {
  const targetPath = options.download ? `${path}${path.includes("?") ? "&" : "?"}download=1` : path;
  return requestBlob(targetPath, true);
}

export const authStorage = {
  getToken,
  setToken(token: string) {
    localStorage.setItem("oxlis_token", token);
  },
  clearToken() {
    localStorage.removeItem("oxlis_token");
  },
};
