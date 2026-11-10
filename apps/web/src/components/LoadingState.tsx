import { LoaderCircle } from "lucide-react";

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-ink-soft">
      <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
