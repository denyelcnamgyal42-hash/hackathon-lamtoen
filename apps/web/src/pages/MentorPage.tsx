import { MessagesSquare } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../lib/auth";
import { useDocumentTitle } from "../lib/documentTitle";

export function MentorPage() {
  useDocumentTitle("Mentor workspace");
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="page py-12">
      <p className="kicker">Verified mentor</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Mentor workspace</h1>
      <p className="mt-4 max-w-2xl leading-7 text-ink-soft">
        Signed in as {user.name}. Your account has the mentor role. Tools for ongoing guidance are not built yet, so this page does not list founders, meetings, or messages.
      </p>
      <div className="mt-8 max-w-xl">
        <EmptyState icon={<MessagesSquare aria-hidden="true" size={20} />} title="No guidance records">
          When mentorship continuity is added, the founders you guide and the decisions already discussed will appear here. Nothing is invented in the meantime.
        </EmptyState>
      </div>
    </div>
  );
}
