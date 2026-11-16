import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CopyCommand } from "@/components/copy-command";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { issueLicense } from "@/lib/license";
import { licenseSecret, stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Your license key", robots: { index: false } };

type Result = { key: string } | { problem: string };

async function licenseFor(sessionId: string | undefined, error: string | undefined): Promise<Result> {
  if (error === "billing_off") return { problem: "Payments are not switched on for this site yet. Nothing was charged." };
  if (error) return { problem: "Checkout did not start. Nothing was charged. Please try again from the pricing section." };
  if (!sessionId || !/^cs_[\w]+$/.test(sessionId)) return { problem: "This page opens after checkout. If you paid and landed here without a key, use the link in your Stripe receipt or write to us." };

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
      <>
        <h1 className="display text-[clamp(2.75rem,6vw,4.5rem)]">No key to show</h1>
        <p className="mt-5 max-w-[40rem]">{result.problem}</p>
        <Link href="/#pricing" className="button mt-8">
          Back to pricing
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="display text-[clamp(2.75rem,6vw,4.5rem)]">You are on Pro</h1>
      <p className="mt-5 max-w-[40rem]">This is your license key. Keep it somewhere safe: it is how the CLI knows you, and how you open your billing page. You can come back to this page from the link in your Stripe receipt.</p>
      <ol className="mt-10 flex max-w-[44rem] flex-col gap-8">
        <li>
          <h2 className="text-xl font-bold">1. Save the key on this machine</h2>
          <CopyCommand command={`npx harnay login ${result.key}`} className="mt-3" />
        </li>
        <li>
          <h2 className="text-xl font-bold">2. Pick your stack and packs</h2>
          <p className="mt-2">The builder gives you the one command to paste in your project.</p>
          <Link href="/new" className="button mt-4">
            Open the builder
          </Link>
        </li>
        <li>
          <h2 className="text-xl font-bold">3. Already installed the free harness?</h2>
          <p className="mt-2">Run the builder&apos;s command in the same folder. It adds the new files and leaves PROJECT.md alone.</p>
        </li>
      </ol>
    </>
  );
}

export default function Welcome({ searchParams }: PageProps<"/welcome">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="shell pb-24 pt-6 md:pt-10">
        <Suspense fallback={<p className="display text-[2rem]">Fetching your key</p>}>
          <Key searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
