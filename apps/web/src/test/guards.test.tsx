import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatJoined } from "../lib/format";
import { founder, jsonResponse, renderAt, requestPath } from "./renderApp";

describe("guarded routes", () => {
  it("sends an anonymous visitor from the founder dashboard to sign in", async () => {
    renderAt("/dashboard");
    expect(await screen.findByRole("heading", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByText(/good to see you/i)).not.toBeInTheDocument();
  });

  it("shows a founder their real account and honest empty states", async () => {
    renderAt("/dashboard", async (input, init) => {
      const path = requestPath(input);
      const method = init?.method ?? "GET";
      if (method === "GET" && path === "/api/auth/me") {
        return jsonResponse({ user: founder, csrfToken: "csrf-token" }, 200);
      }
      if (method === "GET" && path === "/api/founder/workspace") {
        return jsonResponse(
          { profile: founder, venture: null, mentorship: null, research: null },
          200,
        );
      }
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Route not found." } }, 404);
    });

    expect(await screen.findByRole("heading", { name: /good to see you, pema/i })).toBeInTheDocument();
    expect(await screen.findByText("pema@example.com")).toBeInTheDocument();
    expect(screen.getByText(formatJoined(founder.createdAt))).toBeInTheDocument();
    expect(screen.getByText(/no venture is stored yet/i)).toBeInTheDocument();
    expect(screen.getByText(/does not invent one/i)).toBeInTheDocument();
    expect(screen.getByText(/not available in this release/i)).toBeInTheDocument();
    expect(screen.getByText(/does not estimate revenue/i)).toBeInTheDocument();
  });

  it("keeps a founder out of admin and mentor areas", async () => {
    renderAt("/admin", async (input) => {
      if (requestPath(input) === "/api/auth/me") {
        return jsonResponse({ user: founder, csrfToken: "csrf-token" }, 200);
      }
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Route not found." } }, 404);
    });
    expect(await screen.findByRole("heading", { name: /administration is limited/i })).toBeInTheDocument();
    expect(screen.getByText(/cannot grant admin access/i)).toBeInTheDocument();

    renderAt("/mentor", async (input) => {
      if (requestPath(input) === "/api/auth/me") {
        return jsonResponse({ user: founder, csrfToken: "csrf-token" }, 200);
      }
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Route not found." } }, 404);
    });
    expect(await screen.findByRole("heading", { name: /verified mentors only/i })).toBeInTheDocument();
    expect(screen.getByText(/does not grant mentor access/i)).toBeInTheDocument();
  });
});
