import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CopyCommand } from "@/components/copy-command";
import { ProsePage } from "@/components/prose-page";
import { issueLicense } from "@/lib/license";
import { licenseSecret, stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Your license key", robots: { index: false } };

type Result = { key: string } | { problem: string };

async function licenseFor(sessionId: string | undefined, error: string | undefined): Promise<Result> {
  if (error === "billing_off") return { problem: "Payments are not switched on for this site yet. Nothing was charged." };
  if (error) return { problem: "Checkout did not start. Nothing was charged. Please try again from the pricing section." };
  if (!sessionId || !/^cs_[\w]+$/.test(sessionId)) return { problem: "This page opens after checkout. If you paid and landed here without a key, use the link in your Stripe receipt." };

  const api = stripe();
  const secret = licenseSecret();
  if (!api || !secret) return { problem: "Payments are not switched on for this site yet." };

  try {
    const session = await api.checkout.sessions.retrieve(sessionId);
    const subscription = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (session.status !== "complete" || !subscription) return { problem: "This checkout was not completed, so there is no key yet. Nothing was charged." };
    return { key: issueLicense(subscription, secret) };
  } catch {
    return { problem: "We could not find that checkout. If you paid, your receipt has a link back to this page." };
  }
}

async function Key({ searchParams }: { searchParams: PageProps<"/welcome">["searchParams"] }) {
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const result = await licenseFor(one(params.session_id), one(params.error));

  if ("problem" in result) {
    return (
      <ProsePage title="No key to show" lead={result.problem}>
        <Link href="/#pricing" className="btn btn-secondary self-start">
          See the plans
        </Link>
      </ProsePage>
    );
  }

  return (
    <ProsePage title="Your Pro license key" lead="Keep it somewhere safe. It is how the CLI knows you and how you open your billing page. The link in your Stripe receipt brings you back here.">
      <ol className="flex max-w-2xl flex-col gap-8">
        <li className="flex flex-col gap-3">
          <h2 className="title-2">1. Save the key on this machine</h2>
          <CopyCommand command={`npx harnay login ${result.key}`} />
        </li>
        <li className="flex flex-col gap-3">
          <h2 className="title-2">2. Pick your stack and packs</h2>
          <p className="body-3 text-muted">The builder gives you the one command to paste in your project.</p>
          <Link href="/new" className="btn btn-primary self-start">
            Configure your harness
          </Link>
        </li>
        <li className="flex flex-col gap-3">
          <h2 className="title-2">3. Upgrading a free harness</h2>
          <p className="body-3 text-muted">Run the command from the builder in the same folder. It adds the new files and leaves PROJECT.md alone.</p>
        </li>
      </ol>
    </ProsePage>
  );
}

export default function Welcome({ searchParams }: PageProps<"/welcome">) {
  return (
    <Suspense fallback={<ProsePage title="Fetching your key">{null}</ProsePage>}>
      <Key searchParams={searchParams} />
    </Suspense>
  );
}
