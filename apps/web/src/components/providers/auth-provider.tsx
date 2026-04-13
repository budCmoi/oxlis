"use client";

import { startTransition, createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, authStorage } from "@/lib/api";
import { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithSession: (token: string, user: User) => void;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = authStorage.getToken();

    if (!token) {
      startTransition(() => setUser(null));
      setIsLoading(false);
      return;
    }

    try {
      const profile = await apiRequest<User>("/auth/me", { auth: true });
      startTransition(() => setUser(profile));
    } catch {
      authStorage.clearToken();
      startTransition(() => setUser(null));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      loginWithSession: (token: string, nextUser: User) => {
        authStorage.setToken(token);
        setUser(nextUser);
        setIsLoading(false);
      },
      loginWithToken: async (token: string) => {
        authStorage.setToken(token);
        setIsLoading(true);
        await refreshUser();
      },
      logout: () => {
        authStorage.clearToken();
        startTransition(() => setUser(null));
      },
      refreshUser,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
