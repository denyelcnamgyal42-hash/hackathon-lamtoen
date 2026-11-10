import type { Role } from "@lamton/shared";
import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { homeForRole, useAuth } from "../lib/auth";
import { LoadingState } from "./LoadingState";

export function ProtectedRoute({
  roles,
  title,
  body,
  children,
}: {
  roles: Role[];
  title: string;
  body: string;
  children: ReactNode;
}) {
  const { user, status, error, refresh } = useAuth();

  if (status === "loading") {
    return (
      <div className="page py-16">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page max-w-xl py-16">
        <h1 className="font-display text-4xl">We could not confirm your session</h1>
        <p className="mt-3 leading-7 text-ink-soft">{error}</p>
        <button type="button" className="btn btn-primary mt-6" onClick={() => void refresh()}>
          Try again
        </button>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!roles.includes(user.role)) {
    return (
      <div className="page max-w-2xl py-16">
        <p className="kicker">Access</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl leading-7 text-ink-soft">{body}</p>
        <Link to={homeForRole(user.role)} className="btn btn-primary mt-8">
          Go to your workspace
        </Link>
      </div>
    );
  }

  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  if (status === "loading") {
    return (
      <div className="page py-16">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }
  if (user) return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}
