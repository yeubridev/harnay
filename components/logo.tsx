import Link from "next/link";

/**
 * The Harnay mark: a buckle. A closed frame and a prong hinged on its left bar,
 * the tip resting past the right bar. Draws in the current text colour.
 */
export function Buckle({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect x="7.5" y="11.5" width="41" height="41" rx="11" stroke="currentColor" strokeWidth="9" />
      <path d="M8 32h49.5" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Harnay, home" className={`inline-flex items-center gap-2 ${className}`}>
      <Buckle className="h-6 w-6 text-signal" />
      <span className="heading-6 text-fg">harnay</span>
    </Link>
  );
}

/**
 * The buckle fastening: the prong starts drawn back and slides home once, when the
 * mark scrolls into view. Pure CSS (a view timeline), so it needs no script; browsers
 * without view timelines, and reduced motion, show the buckle already closed.
 */
export function BuckleClip({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={`buckle-clip ${className}`} aria-hidden="true">
      <rect x="7.5" y="11.5" width="41" height="41" rx="11" stroke="currentColor" strokeWidth="9" />
      <path d="M8 32h49.5" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}
