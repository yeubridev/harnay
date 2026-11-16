import type { Metadata } from "next";
import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { catalog } from "@/lib/harness/catalog";
import { guardStats, ruleReference } from "@/lib/landing";

export const metadata: Metadata = {
  title: "Docs",
  description: "Install Harnay, what each file does, every guard rule, and what the guard cannot do.",
  alternates: { canonical: "/docs" },
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 border-t-2 border-chalk-3 py-12">
      <h2 className="display text-[clamp(2rem,4vw,2.75rem)]">{title}</h2>
      <div className="mt-5 flex max-w-[44rem] flex-col gap-4">{children}</div>
    </section>
  );
}

const C = ({ children }: { children: React.ReactNode }) => <code className="rounded-[4px] bg-chalk-2 px-1.5 py-0.5 text-[0.875em]">{children}</code>;

export default function Docs() {
  const stats = guardStats();
  const rules = ruleReference();
  const kinds = ["Commands", "Files", "File contents"] as const;

  return (
    <>
      <SiteHeader />
      <main id="main" className="shell pb-24 pt-6 md:pt-10">
        <h1 className="display text-[clamp(2.75rem,6vw,4.5rem)]">Docs</h1>
        <p className="mb-10 mt-4 max-w-[44rem]">Harnay version {catalog.version}. Everything it installs is a text file in your repo, so the real documentation is the files themselves. This page is the map.</p>

        <nav aria-label="On this page" className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-base font-medium">
          {[
            ["install", "Install"],
            ["commands", "Commands"],
            ["files", "Files"],
            ["agents", "Agents"],
            ["rules", "Guard rules"],
            ["limits", "Limits"],
            ["license", "License key"],
            ["remove", "Remove"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="link py-2">
              {label}
            </a>
          ))}
        </nav>

        <Section id="install" title="Install">
          <p>You need Node.js 18 or later. Run this in the root of your project:</p>
          <CopyCommand command="npx harnay@latest init" />
          <p>
            The installer lists every file it will create or replace and waits for your yes. Files it replaces are copied to <C>.harnay/backup/</C> first. It then replays the guard&apos;s examples on your machine and tells you what to type next. To choose a stack, agents and packs, use the{" "}
            <Link href="/new" className="link">
              builder
            </Link>{" "}
            and copy the command it gives you.
          </p>
          <p>
            Claude Code {"2.1.295"} or later is recommended. From that version a guard that fails to start blocks the call instead of letting it through. <C>npx harnay doctor</C> checks your version.
          </p>
        </Section>

        <Section id="commands" title="Commands">
          <dl className="flex flex-col gap-5">
            {[
              ["npx harnay init [stack]", "Install a harness. Flags: --agents claude,cursor,codex, --packs quality,design,ship, --key <license>, --dry-run to look without writing, --yes to skip the confirmation."],
              ["npx harnay audit", "Works in any folder, with or without a harness. Lists what an agent could do there right now: unchecked shell commands, readable or committed secrets files, blanket approvals, keys pasted into agent config. Read-only, no network, and it never opens a secrets file."],
              ["npx harnay doctor", "Check that managed files are present and unchanged, that the hook is registered, that every rule example behaves as written, and that a test call through the hook is denied. Exits 1 on failure, so it works as a CI step."],
              ["npx harnay sync", "Fetch the current version of your harness. Files you have not touched are updated. Files you changed are left alone unless you pass --force, which backs them up first."],
              ["npx harnay login <key>", "Store a Pro license key on this machine, readable only by you. HARNAY_KEY and --key work too."],
              ["node .claude/hooks/guard.mjs --check \"<command>\"", "Ask the guard what it would say about a command, without running anything."],
            ].map(([term, text]) => (
              <div key={term}>
                <dt>
                  <code className="text-base font-semibold">{term}</code>
                </dt>
                <dd className="mt-1">{text}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="files" title="Files">
          <p>Two kinds. Managed files belong to Harnay: sync replaces them while you have not edited them. Your files are written once and never touched again.</p>
          <dl className="flex flex-col gap-5">
            {[
              ["AGENTS.md", "Managed", "Working rules, boundaries, your stack's conventions and its commands. Read by Claude Code, Cursor and Codex."],
              ["CLAUDE.md", "Managed", "Imports AGENTS.md and PROJECT.md for Claude Code."],
              ["PROJECT.md", "Yours", "What you are building, for whom, what done means, what is out of scope. Fill it in with /project-brief or by hand."],
              ["DESIGN.md", "Yours", "Design pack only. The idea, tokens and refused looks the agent must follow for UI."],
              [".claude/settings.json", "Managed", "Deny rules for secrets and for the harness, your stack's pre-approved commands, and the hook registration. Put personal settings in .claude/settings.local.json."],
              [".claude/hooks/", "Managed", "The guard: guard.mjs (entry point), guard-rules.mjs (rules and their examples), guard-shell.mjs (the command reader). No dependencies, no network."],
              [".claude/skills/", "Managed", "One folder per skill. Each says when to use it and how the work is done."],
              [".claude/agents/", "Managed", "Read-only reviewers: code, design, security."],
              ["harnay.json", "Managed", "What was installed and a hash of each managed file. doctor and sync read it."],
            ].map(([file, owner, text]) => (
              <div key={file}>
                <dt className="flex items-baseline gap-3">
                  <code className="text-base font-semibold">{file}</code>
                  <span className="text-[0.9375rem]">{owner}</span>
                </dt>
                <dd className="mt-1">{text}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="agents" title="Agents">
          <dl className="flex flex-col gap-5">
            {catalog.agents.map((agent) => (
              <div key={agent.id}>
                <dt className="font-bold">{agent.title}</dt>
                <dd className="mt-1">{agent.enforcement}.</dd>
              </div>
            ))}
          </dl>
          <p>
            The Claude Code integration is tested against the real CLI. The Cursor adapter follows Cursor&apos;s documented hook contract and is marked beta until it has the same coverage. Cursor only honours &ldquo;ask&rdquo; for shell commands, so for file edits an ask becomes allow there.
          </p>
        </Section>

        <section id="rules" className="scroll-mt-8 border-t-2 border-chalk-3 py-12">
          <h2 className="display text-[clamp(2rem,4vw,2.75rem)]">Guard rules</h2>
          <p className="mt-5 max-w-[44rem]">
            {stats.rules} rules, {stats.examples} examples. &ldquo;Blocks&rdquo; means the agent is told no and why, and you can still run the command yourself. &ldquo;Asks you&rdquo; means you get a permission prompt with the reason. Some blocking rules downgrade to a prompt when the target is clearly local or a feature branch.
          </p>
          {kinds.map((kind) => (
            <div key={kind} className="mt-10">
              <h3 className="text-xl font-bold">{kind}</h3>
              <ul className="mt-3 flex flex-col">
                {rules
                  .filter((rule) => rule.kind === kind)
                  .map((rule, i) => (
                    <li key={rule.id} className={`grid gap-x-6 gap-y-0.5 py-3 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_5.5rem] md:items-baseline ${i ? "border-t-2 border-chalk-2" : ""}`}>
                      <code className="text-[0.9375rem] font-semibold">{rule.id}</code>
                      <span>{rule.title}</span>
                      <span className="text-[0.9375rem] font-bold md:text-right">{rule.decision}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>

        <Section id="limits" title="Limits">
          <p>The guard reads the tool call the agent is about to make. That decides what it can and cannot catch.</p>
          <ul className="flex list-disc flex-col gap-3 pl-6">
            <li>It is not a sandbox. A program the agent runs can do anything your user account can. For operating-system isolation, turn on Claude Code&apos;s sandbox with /sandbox as well.</li>
            <li>It cannot follow a script it did not see being written. Shell scripts the agent writes are read like commands, and piping a download into a shell is blocked. Code in other languages is not analysed beyond one-line scripts.</li>
            <li>A recursive search over the whole project, such as grep -r, can print a line from an ignored file. The permission rules cover the Read, Grep and Glob tools. The sandbox closes the rest.</li>
            <li>It decides from the command text. It does not know whether DATABASE_URL points at production, which is why resets are blocked rather than guessed at.</li>
            <li>Codex has no hook system, so nothing is enforced there.</li>
            <li>A person with a terminal can remove it. It guards the agent, not you.</li>
          </ul>
        </Section>

        <Section id="license" title="License key">
          <p>
            Pro content needs a key. You get it on the page Stripe sends you to after checkout. Run <C>npx harnay login &lt;key&gt;</C> once per machine, or set <C>HARNAY_KEY</C> in CI. The key is checked when the CLI downloads Pro files. Nothing is checked at run time: the guard and the skills keep working offline and after you cancel.
          </p>
          <p>
            Invoices, card and cancellation are at{" "}
            <Link href="/account" className="link">
              Manage subscription
            </Link>
            .
          </p>
        </Section>

        <Section id="remove" title="Remove">
          <p>
            Delete the files listed in <C>harnay.json</C>, then <C>harnay.json</C> itself. Keep PROJECT.md if you like it. There is nothing else to uninstall.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
