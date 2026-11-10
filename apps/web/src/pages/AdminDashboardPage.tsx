import type { AdminSummary } from "@lamton/shared";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "../components/Alert";
import { LoadingState } from "../components/LoadingState";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useDocumentTitle } from "../lib/documentTitle";

const labels = [
  ["founders", "Founder accounts"],
  ["mentors", "Mentor accounts"],
  ["admins", "Admin accounts"],
  ["suspended", "Suspended accounts"],
] as const;

export function AdminDashboardPage() {
  useDocumentTitle("Administration");
  const { user } = useAuth();
  const summary = useQuery({
    queryKey: ["admin-summary"],
    queryFn: () => api<AdminSummary>("/api/admin/summary"),
  });

  if (!user) return null;

  return (
    <div className="page py-12">
      <p className="kicker">Administration</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Account administration</h1>
      <p className="mt-4 max-w-2xl leading-7 text-ink-soft">
        Signed in as {user.name}. These counts are read from the database for this request. Public registration cannot create an admin.
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        Server command: <code className="rounded bg-white px-2 py-1 text-ink">npm run provision:admin</code>
      </p>

      {summary.isPending ? (
        <div className="mt-10">
          <LoadingState label="Counting accounts…" />
        </div>
      ) : null}
      {summary.isError ? (
        <div className="mt-8 grid max-w-xl gap-4">
          <Alert>{summary.error instanceof Error ? summary.error.message : "The admin summary could not be loaded."}</Alert>
          <button type="button" className="btn btn-secondary w-fit" onClick={() => void summary.refetch()}>
            Try again
          </button>
        </div>
      ) : null}
      {summary.data ? (
        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          {labels.map(([key, label]) => (
            <div key={key} className="rounded-[1.7rem] border border-line bg-white px-6 py-5">
              <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
              <dd className="mt-2 font-display text-4xl text-brand">{summary.data.counts[key]}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
