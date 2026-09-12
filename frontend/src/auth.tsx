import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

import { apiLogin } from "@/src/api";
import { storage } from "@/src/utils/storage";

const TOKEN_KEY = "bigs_admin_token";

type AuthState = {
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.secureGet<string>(TOKEN_KEY, "");
      if (saved) setToken(saved);
      setReady(true);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email.trim().toLowerCase(), password);
    await storage.secureSet(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
  };

  const logout = async () => {
    await storage.secureRemove(TOKEN_KEY);
    setToken(null);
  };

  return <AuthContext.Provider value={{ token, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
