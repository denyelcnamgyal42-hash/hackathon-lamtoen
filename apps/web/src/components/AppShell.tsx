import { LogOut } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { homeForRole, useAuth } from "../lib/auth";
import { Alert } from "./Alert";
import { Logo } from "./Logo";

const sectionLinks = [
  { href: "/#purpose", label: "Purpose" },
  { href: "/#journey", label: "Journey" },
  { href: "/#mentorship", label: "Mentorship" },
];

export function AppShell() {
  const { user, status, error, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLogoutError(null);
    setLoggingOut(true);
    navigate("/", { replace: true });
    try {
      await logout();
    } catch (caught) {
      setLogoutError(caught instanceof Error ? caught.message : "Could not log out.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="page flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="Lamton home">
            <Logo />
            <span className="font-display text-[1.7rem] leading-none">Lamton</span>
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
            {sectionLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-ink-soft hover:text-ink">
                {link.label}
              </a>
            ))}
            {status === "loading" ? (
              <p className="text-ink-soft" role="status">
                Checking session…
              </p>
            ) : null}
            {user ? (
              <>
                <Link to={homeForRole(user.role)} className="text-brand">
                  Workspace
                </Link>
                <button type="button" className="btn btn-secondary" onClick={() => void onLogout()} disabled={loggingOut}>
                  <LogOut aria-hidden="true" size={16} />
                  {loggingOut ? "Signing out…" : "Log out"}
                </button>
              </>
            ) : status === "anonymous" ? (
              <>
                <Link to="/login" className="text-brand">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Create account
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      {status === "error" ? (
        <div className="border-b border-danger/20 bg-danger-bg">
          <div className="page flex flex-wrap items-center justify-between gap-3 py-3">
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
            <button type="button" className="btn btn-secondary" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        </div>
      ) : null}
      {logoutError ? (
        <div className="page pt-4">
          <Alert>{logoutError}</Alert>
        </div>
      ) : null}
      <main id="content" className="flex-1" key={location.pathname}>
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="page flex flex-col gap-2 py-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>Lamton · Entrepreneurship and mentorship for Bhutan</p>
          <p>Founder accounts are open. Mentor verification and AI research are not part of this release.</p>
        </div>
      </footer>
    </div>
  );
}
