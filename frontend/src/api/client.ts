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

/**
 * The access token lives in memory only — NOT localStorage — for the lifetime of this page
 * load. This is a real, meaningful reduction in XSS exposure versus the previous approach:
 * a script-injection attack can no longer simply read a persisted token out of storage.
 * The trade-off is that a full page reload loses it, which is why AuthProvider calls
 * silentRefresh() on startup to get a fresh one from the httpOnly refresh cookie — the
 * refresh token itself is never readable by JS at all, in storage or in memory.
 */
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
  /** Internal: prevents infinite retry loops when refresh itself fails. */
  _isRetry?: boolean;
}

async function rawRequest(path: string, options: RequestOptions) {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`${API_URL}/api/v1${path}`, {
    method,
    headers,
    // Needed so the httpOnly refresh-token cookie is sent on /auth/refresh and /auth/logout
    // (the cookie is scoped server-side to /api/v1/auth, so this has no effect elsewhere).
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** Attempts to trade the httpOnly refresh cookie for a new access token. Never throws —
 *  returns whether it succeeded, since callers treat failure as "not logged in" rather than
 *  an error to surface. */
export async function silentRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) return false;
    setAccessToken(json.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await rawRequest(path, options);
  const json = await res.json().catch(() => null);

  if (res.status === 401 && options.auth && !options._isRetry) {
    // The access token likely expired mid-session — try exactly one silent refresh before
    // giving up, so a 15-minute access-token lifetime doesn't mean re-login every 15 minutes.
    const refreshed = await silentRefresh();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _isRetry: true });
    }
  }

  if (!res.ok || !json?.success) {
    const err = json?.error ?? { code: "UNKNOWN", message: "Request failed" };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }

  return json.data as T;
}
