import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAt } from "./renderApp";

describe("landing page", () => {
  it("explains the purpose, the founder journey, and mentorship continuity", async () => {
    renderAt("/");

    expect(
      await screen.findByRole("heading", { level: 1, name: /guidance that stays with the venture/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /founder journey/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /mentorship with a memory/i })).toBeInTheDocument();
    expect(screen.getByText(/does not assign a mentor/i)).toBeInTheDocument();

    const registerLinks = screen.getAllByRole("link", { name: /create a founder account/i });
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0]).toHaveAttribute("href", "/register");
    expect(screen.getAllByRole("link", { name: /^sign in$/i }).length).toBeGreaterThan(0);
  });
});
