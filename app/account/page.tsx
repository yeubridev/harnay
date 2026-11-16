import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Manage subscription", robots: { index: false } };

const PROBLEMS: Record<string, string> = {
  missing: "Paste your license key first.",
  invalid: "That key is not valid. Copy it again from your welcome page or your terminal: it starts with hny_.",
  inactive: "That subscription has ended. You can start a new one from the pricing section.",
  not_configured: "Billing is not switched on for this site yet.",
  billing_off: "Billing is not switched on for this site yet.",
};

async function Problem({ searchParams }: { searchParams: PageProps<"/account">["searchParams"] }) {
  const { error } = await searchParams;
  const code = Array.isArray(error) ? error[0] : error;
  if (!code) return null;
  return (
    <p id="key-error" role="alert" className="mt-2 font-semibold text-stop">
      {PROBLEMS[code] ?? "Something went wrong. Please try again."}
    </p>
  );
}

export default function Account({ searchParams }: PageProps<"/account">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="shell pb-24 pt-6 md:pt-10">
        <h1 className="display text-[clamp(2.75rem,6vw,4.5rem)]">Manage subscription</h1>
        <p className="mt-5 max-w-[40rem]">Enter your license key to open your billing page at Stripe. There you can download invoices, change your card or cancel. Cancelling takes one click and the harness in your repos keeps working.</p>
        <form action="/api/portal" method="post" className="mt-8 flex max-w-[40rem] flex-col gap-2">
          <label htmlFor="key" className="font-bold">
            License key
          </label>
          <input
            id="key"
            name="key"
            type="text"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="hny_..."
            aria-describedby="key-help key-error"
            className="min-h-12 rounded-control border-2 border-ink bg-chalk px-3 font-mono text-base placeholder:text-ink-2"
          />
          <Suspense fallback={null}>
            <Problem searchParams={searchParams} />
          </Suspense>
          <p id="key-help" className="text-[0.9375rem]">
            Lost it? It is in <code className="text-[0.875rem]">~/.config/harnay/key</code> on any machine where you ran <code className="whitespace-nowrap text-[0.875rem]">npx harnay login</code>.
          </p>
          <button type="submit" className="button mt-4 self-start">
            Open billing page
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
