import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/types/api";
import { fetchCurrentUser, loginRequest, registerRequest, logoutRequest } from "@/api/authApi";
import { setAccessToken, silentRefresh } from "@/api/client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // The access token lives only in memory, so a fresh page load never has one yet — the
    // only way to know if there's an existing session is to try exchanging the httpOnly
    // refresh cookie (invisible to this code) for a new access token. If that fails, there
    // was no valid session, which is a completely normal, expected outcome, not an error.
    silentRefresh().then((ok) => {
      if (!ok) {
        setStatus("unauthenticated");
        return;
      }
      fetchCurrentUser()
        .then((u) => {
          setUser(u);
          setStatus("authenticated");
        })
        .catch(() => {
          setAccessToken(null);
          setStatus("unauthenticated");
        });
    });
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const result = await loginRequest({ email, password });
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }

  async function register(email: string, password: string, name?: string) {
    const result = await registerRequest({ email, password, name });
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus("authenticated");
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Even if the server call fails (e.g. already-expired session), still clear local
      // state below — the user's intent to log out should always succeed from their
      // perspective, regardless of network conditions.
    }
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }

  async function refreshUser() {
    const u = await fetchCurrentUser();
    setUser(u);
  }

  return (
    <AuthContext.Provider value={{ status, user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
