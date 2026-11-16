import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage, ProseSection } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Harnay: what you get, what it costs, how to cancel, and what the guard does not promise.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <ProsePage title="Terms" lead="Plain terms for a small product. Last updated 16 November 2026.">
      <ProseSection title="What you get">
        <p>Harnay provides a command line tool and text files that configure coding agents in your repository. The free harness is free to use in any project. Pro and Team add templates, skills and reviewers for as long as your subscription is active, and the files already in your repositories keep working after it ends.</p>
      </ProseSection>
      <ProseSection title="What it does not promise">
        <p>
          The guard reduces the chance that a coding agent runs a destructive command. It is not a sandbox and it cannot catch everything. The{" "}
          <Link href="/docs#limits" className="link text-fg">
            limits
          </Link>{" "}
          are listed in the docs. You remain responsible for your backups, your credentials and what you approve. Harnay is provided as is, without warranty, and liability is limited to the amount you paid in the twelve months before a claim, to the extent the law allows.
        </p>
      </ProseSection>
      <ProseSection title="Price and billing">
        <p>Pro costs 19 US dollars a month and Team costs 79 US dollars a month, billed through Stripe until you cancel. Taxes may be added where they apply.</p>
      </ProseSection>
      <ProseSection title="Cancelling and refunds">
        <p>
          Cancel at any time from the{" "}
          <Link href="/account" className="link text-fg">
            subscription page
          </Link>
          . Your plan stays active until the end of the period you paid for. Ask within 14 days of your first payment and it is refunded in full.
        </p>
      </ProseSection>
      <ProseSection title="License keys">
        <p>A Pro key is for one developer. A Team key is for up to 10 developers in one organisation. Do not publish a key. A key that is shared publicly may be revoked.</p>
      </ProseSection>
      <ProseSection title="The files">
        <p>You may use, change and commit the files Harnay installs in your own projects and your clients&apos; projects. You may not resell the Pro templates, skills or reviewers as a product of your own.</p>
      </ProseSection>
      <ProseSection title="Changes">
        <p>If these terms change in a way that matters, subscribers are told by email before the change applies.</p>
      </ProseSection>
    </ProsePage>
  );
}
