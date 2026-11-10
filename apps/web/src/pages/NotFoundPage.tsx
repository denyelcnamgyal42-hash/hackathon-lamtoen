import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/documentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="page py-20">
      <p className="kicker">404</p>
      <h1 className="mt-3 font-display text-5xl">This page is not part of Lamton.</h1>
      <p className="mt-4 max-w-lg leading-7 text-ink-soft">The address does not match a public page or a workspace.</p>
      <Link to="/" className="btn btn-primary mt-8">
        Back to the start
      </Link>
    </div>
  );
}
