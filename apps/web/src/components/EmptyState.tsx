import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.7rem] border border-line bg-white p-6">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-paper text-brand">{icon}</div>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{children}</p>
    </section>
  );
}
