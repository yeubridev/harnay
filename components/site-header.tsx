import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { SiteNav } from "@/components/site-nav";

export { Wordmark };

export function SiteHeader() {
  return <SiteNav />;
}

const FOOTER_LINKS = [
  ["/new", "Get Harnay"],
  ["/docs", "Docs"],
  ["/docs#rules", "Guard rules"],
  ["/#pricing", "Pricing"],
  ["/account", "Subscription"],
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="wrap flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-md flex-col gap-4">
          <Wordmark />
          <p className="caption-2 text-muted">Harnay is independent and not affiliated with Anthropic, Cursor or OpenAI. Claude Code, Cursor and Codex are trademarks of their owners.</p>
          <p className="caption-2 text-muted">© 2026 Harnay</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6">
            {FOOTER_LINKS.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="link-draw caption-1 block py-3 text-muted">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
