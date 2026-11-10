import type { AuthSessionResponse, LoginRequest, PublicUser, RegisterRequest, Role } from "@lamton/shared";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ApiError, api, setCsrfToken } from "./api";

const SESSION_KEY = ["session"] as const;

function rememberSession(queryClient: QueryClient, response: AuthSessionResponse): void {
  const next: SessionData = {
    user: response.user,
    csrfToken: response.csrfToken,
  };
  setCsrfToken(response.csrfToken);
  queryClient.setQueryData(SESSION_KEY, next);
}

interface SessionData {
  user: PublicUser;
  csrfToken: string;
}

export type AuthStatus = "loading" | "authenticated" | "anonymous" | "error";

interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  error: string | null;
  refresh: () => Promise<void>;
  login: (input: LoginRequest) => Promise<PublicUser>;
  register: (input: RegisterRequest) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<SessionData | null> {
  try {
    const response = await api<AuthSessionResponse>("/api/auth/me");
    setCsrfToken(response.csrfToken);
    return { user: response.user, csrfToken: response.csrfToken };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setCsrfToken(null);
      return null;
    }
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
  });

  const value = useMemo<AuthContextValue>(() => {
    const status: AuthStatus = session.isPending
      ? "loading"
      : session.isError
        ? "error"
        : session.data
          ? "authenticated"
          : "anonymous";

    return {
      user: session.data?.user ?? null,
      status,
      error: session.error instanceof Error ? session.error.message : session.isError ? "The session could not be checked." : null,
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      },
      login: async (input) => {
        const response = await api<AuthSessionResponse>("/api/auth/login", { method: "POST", body: input });
        rememberSession(queryClient, response);
        return response.user;
      },
      register: async (input) => {
        const response = await api<AuthSessionResponse>("/api/auth/register", { method: "POST", body: input });
        rememberSession(queryClient, response);
        return response.user;
      },
      logout: async () => {
        await api<void>("/api/auth/logout", { method: "POST" });
        setCsrfToken(null);
        queryClient.setQueryData<SessionData | null>(SESSION_KEY, null);
      },
    };
  }, [queryClient, session.data, session.error, session.isError, session.isPending]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}

export function homeForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "mentor":
      return "/mentor";
    case "founder":
      return "/dashboard";
  }
}
