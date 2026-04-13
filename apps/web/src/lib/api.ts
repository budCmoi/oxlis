const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const MEMORY_CACHE_TTL_MS = 15_000;

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inflightRequests = new Map<string, Promise<unknown>>();

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("oxlis_token");
};

const buildError = async (response: Response) => {
  const payload = (await response.json().catch(() => ({ message: "Echec de la requete" }))) as {
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

    return new Error(`${payload.message ?? "Echec de la requete"} : ${details}`);
  }

  return new Error(payload.message ?? "Echec de la requete");
};

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

  const response = await fetch(`${API_URL}${path}`, {
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

  const response = await fetch(`${API_URL}/uploads/listing-images`, {
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

export const authStorage = {
  getToken,
  setToken(token: string) {
    localStorage.setItem("oxlis_token", token);
  },
  clearToken() {
    localStorage.removeItem("oxlis_token");
  },
};
