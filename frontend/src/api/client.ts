export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  _isRetry?: boolean;
}

async function rawRequest(path: string, options: RequestOptions) {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`${API_URL}/api/v1${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Single in-flight promise to prevent multiple parallel refresh requests
let refreshPromise: Promise<boolean> | null = null;

export async function silentRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setAccessToken(null);
        return false;
      }
      setAccessToken(json.data.accessToken);
      return true;
    } catch {
      setAccessToken(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await rawRequest(path, options);
  const json = await res.json().catch(() => null);

  if (res.status === 401 && options.auth && !options._isRetry) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _isRetry: true });
    }

    // Refresh token expired / invalid — clean redirect to login
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return new Promise<never>(() => {}); // halts further processing while redirecting
    }
  }

  if (!res.ok || !json?.success) {
    const err = json?.error ?? { code: "UNKNOWN", message: "Request failed" };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }

  return json.data as T;
}