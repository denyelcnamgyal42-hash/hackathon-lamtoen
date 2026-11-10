import type { ReactNode } from "react";

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/25 bg-danger-bg px-4 py-3 text-sm leading-6 text-danger">
      {children}
    </div>
  );
}
