import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { anonymousSession, renderAt, requestPath } from "./renderApp";

describe("authentication forms", () => {
  it("shows accessible registration fields and blocks an empty submit", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(anonymousSession);
    renderAt("/register", fetchMock);

    expect(await screen.findByRole("heading", { name: /create a founder account/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    const posts = fetchMock.mock.calls.filter((call) => {
      const init = call[1] as RequestInit | undefined;
      return (init?.method ?? "GET") === "POST" && requestPath(call[0]).includes("/api/auth/register");
    });
    expect(posts).toHaveLength(0);
  });

  it("shows an accessible sign-in form", async () => {
    renderAt("/login");
    expect(await screen.findByRole("heading", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("link", { name: /create a founder account/i })).toHaveAttribute("href", "/register");
  });
});
