const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
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
