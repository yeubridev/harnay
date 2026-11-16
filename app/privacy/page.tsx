import type { Metadata } from "next";
import { ProsePage, ProseSection } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Harnay collects: your payment details through Stripe if you subscribe, and ordinary server logs. Nothing from your code.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <ProsePage title="Privacy" lead="Harnay is built so that there is very little to say here. Last updated 16 November 2026.">
      <ProseSection title="Your code">
        <p>Harnay never receives it. The CLI downloads text files and writes them into your repository. It uploads nothing. The guard hook runs on your machine and makes no network calls.</p>
      </ProseSection>
      <ProseSection title="What the CLI sends">
        <p>When you run init or sync, the CLI asks this site for a harness. The request carries the stack, agents and packs you chose, the CLI version, and your license key if you have one. It carries no file names, no file contents and nothing about your project.</p>
      </ProseSection>
      <ProseSection title="Accounts">
        <p>There are none. Harnay keeps no user database. A license key is derived from your Stripe subscription and checked against Stripe when the CLI downloads Pro files.</p>
      </ProseSection>
      <ProseSection title="Payments">
        <p>Stripe processes payments and holds your name, email, billing address and card. Harnay can see your subscription status and the contact details on the invoice in the Stripe dashboard. Stripe has its own privacy policy.</p>
      </ProseSection>
      <ProseSection title="Logs and cookies">
        <p>The hosting provider keeps ordinary request logs, including IP address, for a limited time, to run and protect the service. This site sets no advertising or tracking cookies.</p>
      </ProseSection>
      <ProseSection title="Your rights">
        <p>You can cancel and download your invoices from the subscription page at any time. To ask for your billing data to be exported or deleted, reply to any Stripe receipt from Harnay.</p>
      </ProseSection>
    </ProsePage>
  );
}
