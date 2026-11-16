import type { Metadata } from "next";
import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { C, ProsePage, ProseSection } from "@/components/prose-page";
import { catalog } from "@/lib/harness/catalog";
import { guardStats, ruleReference } from "@/lib/landing";

export const metadata: Metadata = {
  title: "Docs",
  description: "Install Harnay, what each file does, every guard rule, and what the guard cannot do.",
  alternates: { canonical: "/docs" },
};

const SECTIONS = [
  ["install", "Install"],
  ["commands", "Commands"],
  ["files", "Files"],
  ["agents", "Agents"],
  ["rules", "Guard rules"],
  ["limits", "Limits"],
  ["license", "License key"],
  ["remove", "Remove"],
] as const;

const COMMANDS = [
  ["npx harnay init [stack]", "Install a harness. Flags: --agents claude,cursor,codex, --packs quality,design,ship, --key <license>, --dry-run to look without writing, --yes to skip the confirmation."],
  ["npx harnay audit", "Works in any folder, with or without a harness. Lists what an agent could do there right now: unchecked shell commands, readable or committed secrets files, blanket approvals, keys pasted into agent config. It changes nothing, uses no network and never opens a secrets file."],
  ["npx harnay doctor", "Checks that managed files are present and unchanged, that the hook is registered, that every rule example behaves as written, and that a test call through the hook is denied. Exits 1 on failure, so it works as a CI step."],
  ["npx harnay sync", "Fetches the current version of your harness. Files you have not touched are updated. Files you changed are left alone unless you pass --force, which backs them up first."],
  ["npx harnay login <key>", "Stores a Pro license key on this machine, readable only by you. HARNAY_KEY and --key work too."],
  ['node .claude/hooks/guard.mjs --check "<command>"', "Asks the guard what it would say about a command, without running anything."],
] as const;

const FILES = [
  ["AGENTS.md", "Managed", "Working rules, boundaries, the conventions of your stack and its commands. Read by Claude Code, Cursor and Codex."],
  ["CLAUDE.md", "Managed", "Imports AGENTS.md and PROJECT.md for Claude Code."],
  ["PROJECT.md", "Yours", "What you are building, for whom, what done means, what is out of scope. Fill it in with /project-brief or by hand."],
  ["DESIGN.md", "Yours", "Design pack only. The idea, tokens and refused looks the agent must follow for UI."],
  [".claude/settings.json", "Managed", "Deny rules for secrets and for the harness, the commands your stack approves in advance, and the hook registration. Put personal settings in .claude/settings.local.json."],
  [".claude/hooks/", "Managed", "The guard: guard.mjs (entry point), guard-rules.mjs (rules and their examples), guard-shell.mjs (the command reader). No dependencies, no network."],
  [".claude/skills/", "Managed", "One folder per skill. Each says when to use it and how the work is done."],
  [".claude/agents/", "Managed", "Reviewers that cannot edit files: code, design, security."],
  ["harnay.json", "Managed", "What was installed and a hash of each managed file. The doctor and sync commands read it."],
] as const;

export default function Docs() {
  const stats = guardStats();
  const rules = ruleReference();
  const kinds = ["Commands", "Files", "File contents"] as const;

  return (
    <ProsePage title="Docs" lead={`Harnay version ${catalog.version}. Everything it installs is a text file in your repo, so the real documentation is the files themselves. This page is the map.`}>
      <nav aria-label="On this page">
        <ul className="flex flex-wrap gap-x-6">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="link-draw caption-1 block py-2 text-muted">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ProseSection id="install" title="Install">
        <p>You need Node.js 18 or later. Run this in the root of your project:</p>
        <CopyCommand command="npx harnay@latest init" />
        <p>
          The installer lists every file it will create or replace and waits for your yes. Files it replaces are copied to <C>.harnay/backup/</C> first. It then replays the guard examples on your machine and tells you what to type next. To choose a stack, agents and packs, use the{" "}
          <Link href="/new" className="link text-fg">
            builder
          </Link>{" "}
          and copy the command it gives you.
        </p>
        <p>
          Claude Code 2.1.295 or later is recommended. From that version a guard that fails to start blocks the call instead of letting it through. <C>npx harnay doctor</C> checks your version.
        </p>
      </ProseSection>

      <ProseSection id="commands" title="Commands">
        <dl className="flex flex-col gap-6">
          {COMMANDS.map(([term, text]) => (
            <div key={term} className="flex flex-col gap-1">
              <dt>
                <code className="caption-1 text-fg">{term}</code>
              </dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </ProseSection>

      <ProseSection id="files" title="Files">
        <p>Two kinds. Managed files belong to Harnay: sync replaces them while you have not edited them. Your files are written once and never touched again.</p>
        <dl className="flex flex-col gap-6">
          {FILES.map(([file, owner, text]) => (
            <div key={file} className="flex flex-col gap-1">
              <dt className="flex items-center gap-3">
                <code className="caption-1 text-fg">{file}</code>
                <span className={`chip ${owner === "Yours" ? "chip-ask" : "chip-plain"}`}>{owner}</span>
              </dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </ProseSection>

      <ProseSection id="agents" title="Agents">
        <dl className="flex flex-col gap-6">
          {catalog.agents.map((agent) => (
            <div key={agent.id} className="flex flex-col gap-1">
              <dt className="title-3 text-fg">{agent.title}</dt>
              <dd>{agent.enforcement}.</dd>
            </div>
          ))}
        </dl>
        <p>The Claude Code integration is tested against the real CLI. The Cursor adapter follows the hook contract Cursor documents and stays in beta until it has the same coverage. Cursor only honours an ask for shell commands, so for file edits an ask becomes an allow there.</p>
      </ProseSection>

      <section id="rules" className="flex scroll-mt-24 flex-col gap-6">
        <h2 className="heading-5">Guard rules</h2>
        <p className="body-3 max-w-2xl text-muted">
          {stats.rules} rules, {stats.examples} examples. Blocks means the agent is told no and why, and you can still run the command yourself. Asks you means you get a permission prompt with the reason. Some blocking rules step down to a prompt when the target is clearly local or a feature branch.
        </p>
        {kinds.map((kind) => (
          <div key={kind} className="flex flex-col gap-3">
            <h3 className="title-2">{kind}</h3>
            <ul className="flex flex-col gap-1">
              {rules
                .filter((rule) => rule.kind === kind)
                .map((rule) => (
                  <li key={rule.id} className="grid items-baseline gap-x-6 gap-y-1 rounded-xl border border-line bg-panel p-3 md:grid-cols-[14rem_1fr_auto]">
                    <code className="caption-1 text-fg">{rule.id}</code>
                    <span className="caption-2 text-muted">{rule.title}</span>
                    <span className={`chip justify-self-start ${rule.decision === "Blocks" ? "chip-deny" : "chip-ask"}`}>{rule.decision}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <ProseSection id="limits" title="Limits">
        <p>The guard reads the tool call the agent is about to make. That decides what it can and cannot catch.</p>
        <ul className="flex list-disc flex-col gap-3 pl-6">
          <li>It is not a sandbox. A program the agent runs can do anything your user account can. For isolation at the operating system level, turn on the Claude Code sandbox with /sandbox as well.</li>
          <li>It cannot follow a script it did not see being written. Shell scripts the agent writes are read like commands, and piping a download into a shell is blocked. Code in other languages is not analysed beyond scripts passed inline.</li>
          <li>A recursive search over the whole project, such as grep -r, can print a line from an ignored file. The permission rules cover the Read, Grep and Glob tools. The sandbox closes the rest.</li>
          <li>It decides from the command text. It does not know whether DATABASE_URL points at production, which is why resets are blocked rather than guessed at.</li>
          <li>Codex has no hook system, so nothing is enforced there.</li>
          <li>A person with a terminal can remove it. It guards the agent, not you.</li>
        </ul>
      </ProseSection>

      <ProseSection id="license" title="License key">
        <p>
          Pro content needs a key. You get it on the page Stripe sends you to after checkout. Run <C>npx harnay login &lt;key&gt;</C> once per machine, or set <C>HARNAY_KEY</C> in CI. The key is checked when the CLI downloads Pro files. Nothing is checked at run time: the guard and the skills keep working offline and after you cancel.
        </p>
        <p>
          Invoices, card and cancellation are on the{" "}
          <Link href="/account" className="link text-fg">
            subscription page
          </Link>
          .
        </p>
      </ProseSection>

      <ProseSection id="remove" title="Remove">
        <p>
          Delete the files listed in <C>harnay.json</C>, then <C>harnay.json</C> itself. Keep PROJECT.md if you like it. There is nothing else to uninstall.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
