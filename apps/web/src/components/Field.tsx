import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | undefined;
}

export function Field({ id, label, hint, error, ...props }: FieldProps) {
  const fieldId = id ?? props.name;
  if (!fieldId) throw new Error("Field requires an id.");
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <label htmlFor={fieldId} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="h-12 rounded-2xl border border-line bg-paper px-4 text-base text-ink"
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-sm leading-6 text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm leading-6 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
