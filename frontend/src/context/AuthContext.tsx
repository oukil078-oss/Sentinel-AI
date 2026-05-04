import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, formatApiError } from "../lib/api";

export type User = {
  _id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  created_at?: string;
};

type AuthContextType = {
  user: User | null | undefined; // undefined = loading, null = not logged in
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem("sentinel_token");
    const cached = localStorage.getItem("sentinel_user");
    if (!token) {
      setUser(null);
      return;
    }
    // Set cached user immediately for instant UI
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch {}
    }
    // Verify with server
    api.get("/api/auth/me")
      .then((r) => {
        setUser(r.data.user);
        localStorage.setItem("sentinel_user", JSON.stringify(r.data.user));
      })
      .catch(() => {
        localStorage.removeItem("sentinel_token");
        localStorage.removeItem("sentinel_user");
        setUser(null);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("sentinel_token", data.access_token);
      localStorage.setItem("sentinel_user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (err: any) {
      throw new Error(formatApiError(err));
    }
  };

  const logout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    localStorage.removeItem("sentinel_token");
    localStorage.removeItem("sentinel_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
