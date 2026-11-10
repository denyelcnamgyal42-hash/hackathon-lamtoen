export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`inline-flex ${className} items-center justify-center rounded-full bg-brand text-paper`} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-7 w-7">
        <g fill="none" stroke="currentColor" strokeWidth="1.7">
          <ellipse cx="32" cy="18" rx="7" ry="13" />
          <ellipse cx="32" cy="18" rx="7" ry="13" transform="rotate(60 32 32)" />
          <ellipse cx="32" cy="18" rx="7" ry="13" transform="rotate(120 32 32)" />
        </g>
        <circle cx="32" cy="32" r="3.2" fill="#E0791F" stroke="none" />
      </svg>
    </span>
  );
}
