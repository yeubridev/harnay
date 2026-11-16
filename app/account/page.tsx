import type { Metadata } from "next";
import { Suspense } from "react";
import { C, ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Subscription", robots: { index: false } };

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
    <p id="key-error" role="alert" className="body-2 text-stop">
      {PROBLEMS[code] ?? "Something went wrong. Please try again."}
    </p>
  );
}

export default function Account({ searchParams }: PageProps<"/account">) {
  return (
    <ProsePage title="Subscription" lead="Enter your license key to open your billing page at Stripe. There you can download invoices, change your card or cancel. Cancelling takes one click and the harness in your repos keeps working.">
      <form action="/api/portal" method="post" className="flex max-w-2xl flex-col gap-3">
        <label htmlFor="key" className="title-3">
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
          className="caption-2 rounded-xl border border-line bg-well px-3 py-3 font-mono text-fg placeholder:text-muted"
        />
        <Suspense fallback={null}>
          <Problem searchParams={searchParams} />
        </Suspense>
        <p id="key-help" className="caption-2 text-muted">
          Lost it? It is in <C>~/.config/harnay/key</C> on any machine where you ran <C>npx harnay login</C>.
        </p>
        <button type="submit" className="btn btn-primary self-start">
          Open the billing page
        </button>
      </form>
    </ProsePage>
  );
}
