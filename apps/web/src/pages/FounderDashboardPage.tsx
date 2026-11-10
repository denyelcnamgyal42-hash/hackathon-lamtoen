import type { FounderWorkspace } from "@lamton/shared";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MessagesSquare, Search } from "lucide-react";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useDocumentTitle } from "../lib/documentTitle";
import { formatJoined, givenName, roleLabel, stateLabel } from "../lib/format";

export function FounderDashboardPage() {
  useDocumentTitle("Founder workspace");
  const { user } = useAuth();
  const workspace = useQuery({
    queryKey: ["founder-workspace"],
    queryFn: () => api<FounderWorkspace>("/api/founder/workspace"),
  });

  if (!user) return null;

  return (
    <div className="page py-12">
      <p className="kicker">Founder workspace</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Good to see you, {givenName(user.name)}.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-ink-soft">
        This page shows the account signed in to this browser. It does not estimate revenue, invent a mentor, or fill the workspace with sample numbers.
      </p>

      {workspace.isPending ? (
        <div className="mt-10">
          <LoadingState label="Loading your account…" />
        </div>
      ) : null}

      {workspace.isError ? (
        <div className="mt-8 grid max-w-xl gap-4">
          <Alert>{workspace.error instanceof Error ? workspace.error.message : "The workspace could not be loaded."}</Alert>
          <button type="button" className="btn btn-secondary w-fit" onClick={() => void workspace.refetch()}>
            Try again
          </button>
        </div>
      ) : null}

      {workspace.data ? (
        <>
          <dl className="mt-10 grid gap-px overflow-hidden rounded-[1.7rem] border border-line bg-line sm:grid-cols-2">
            <Fact label="Name" value={workspace.data.profile.name} />
            <Fact label="Email" value={workspace.data.profile.email} />
            <Fact label="Role" value={roleLabel(workspace.data.profile.role)} />
            <Fact label="Account" value={stateLabel(workspace.data.profile.accountState)} />
            <Fact label="Joined" value={formatJoined(workspace.data.profile.createdAt)} />
          </dl>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {workspace.data.venture === null ? (
              <EmptyState icon={<Briefcase aria-hidden="true" size={20} />} title="Venture record">
                No venture is stored yet. When venture profiles are added, this is where the business description, stage, and decisions will live. There is no sample company on this page.
              </EmptyState>
            ) : null}
            {workspace.data.mentorship === null ? (
              <EmptyState icon={<MessagesSquare aria-hidden="true" size={20} />} title="Mentorship">
                No mentor is connected to this account. Signing up as a founder does not assign a mentor, and Lamton does not invent one.
              </EmptyState>
            ) : null}
            {workspace.data.research === null ? (
              <EmptyState icon={<Search aria-hidden="true" size={20} />} title="Business research">
                AI-guided research is not available in this release. Nothing has been generated for your account.
              </EmptyState>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}</dt>
      <dd className="mt-1 text-lg">{value}</dd>
    </div>
  );
}
