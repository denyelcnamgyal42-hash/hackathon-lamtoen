import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AppRoutes } from "../App";
import { AuthProvider } from "../lib/auth";

export function renderAt(path: string, handler: FetchHandler = anonymousSession) {
  vi.stubGlobal("fetch", vi.fn(handler));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const anonymousSession: FetchHandler = async (input) => {
  const path = requestPath(input);
  if (path === "/api/auth/me") {
    return jsonResponse({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  }
  return jsonResponse({ error: { code: "NOT_FOUND", message: "Route not found." } }, 404);
};

export function requestPath(input: RequestInfo | URL): string {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  return new URL(url, "http://localhost").pathname;
}

export const founder = {
  id: "64b000000000000000000001",
  name: "Pema Dorji",
  email: "pema@example.com",
  role: "founder" as const,
  accountState: "active" as const,
  createdAt: "2026-04-02T00:00:00.000Z",
};
