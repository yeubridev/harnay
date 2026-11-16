import Link from "next/link";

export function Wordmark() {
  return (
    <Link href="/" aria-label="Harnay, home" className="display inline-flex items-center gap-2 text-[1.75rem] leading-none">
      <span aria-hidden="true" className="strap inline-block h-6 w-3 rounded-[2px] border-2 border-ink" />
      harnay
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="shell flex items-center justify-between gap-4 py-5">
      <Wordmark />
      <nav aria-label="Main" className="flex items-center gap-1 text-base font-medium md:gap-2">
        <Link href="/#inside" className="nav-link hidden md:inline">
          What it installs
        </Link>
        <Link href="/#pricing" className="nav-link hidden sm:inline">
          Pricing
        </Link>
        <Link href="/docs" className="nav-link">
          Docs
        </Link>
        <Link href="/new" className="button ml-1 !min-h-11 !px-4 !text-base">
          Build yours
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-chalk-2">
      <div className="shell flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <Wordmark />
          <p className="mt-4 text-base">
            Harnay is independent. It is not affiliated with Anthropic, Cursor or OpenAI. Claude Code, Cursor and Codex are trademarks of their owners.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-1 text-base font-medium">
          {[
            ["/new", "Build your harness"],
            ["/docs", "Docs"],
            ["/docs#rules", "Every guard rule"],
            ["/#pricing", "Pricing"],
            ["/account", "Manage subscription"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="link py-2">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
