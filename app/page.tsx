import { CloudSlashIcon, CubeIcon, FileTextIcon, LockIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { Buckle, BuckleClip } from "@/components/logo";
import { SessionReplay } from "@/components/session-replay";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Steps } from "@/components/steps";
import { WordReveal } from "@/components/word-reveal";
import { catalog } from "@/lib/harness/catalog";
import { guardStats, inside, sessionReplay, steps } from "@/lib/landing";

const INIT = "npx harnay@latest init";
const CHIP = { deny: ["chip-deny", "Blocked"], ask: ["chip-ask", "Asks you"], allow: ["chip-allow", "Runs"] } as const;

const faq = [
  {
    q: "There are free harness repos. Why pay?",
    a: "You may not need to. The guard, the rules file and the project brief are free for good. Pro adds stack templates, skills and reviewers, and keeps them current through npx harnay sync when Claude Code changes a format or a new failure pattern appears.",
  },
  {
    q: "Can the agent switch the guard off?",
    a: "It is refused three ways. Permission rules deny edits to the settings file and the hooks folder. The guard blocks shell commands that change, move or delete those files. And npx harnay doctor fails when a managed file has changed, which works as a CI step. A person with a terminal can always remove it.",
  },
  {
    q: "Does it work in bypass permissions mode?",
    a: "Claude Code documents that deny rules block in every mode, bypass included, and that hooks run before the permission prompt. The harness uses both.",
  },
  {
    q: "Is the guard a sandbox?",
    a: "No. It reads the command the agent is about to run. It cannot see inside a program it did not watch being written. Turn on the Claude Code sandbox as well for isolation at the operating system level.",
  },
  {
    q: "What does Harnay see of my code?",
    a: "Nothing. The CLI downloads text files and writes them into your repo. It uploads nothing, and the guard makes no network calls.",
  },
  {
    q: "What happens to my existing CLAUDE.md?",
    a: "The installer lists every file it will create or replace and waits for your yes. Replaced files are copied to .harnay/backup first. Your own rules belong in PROJECT.md, which is never overwritten.",
  },
  {
    q: "Does it work with Cursor and Codex?",
    a: "Cursor gets the same guard through its hook system, in beta. Codex reads the rules and skills but has no hook, so nothing is enforced there.",
  },
  {
    q: "How do I cancel?",
    a: "From Subscription in the footer, with your license key. It opens the Stripe portal, where cancelling takes one click. Ask within 14 days of your first payment for a full refund.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
};

export default function Home() {
  const stats = guardStats();
  const replay = sessionReplay();
  const layers = inside();

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* 1. Hero: what it is, for whom, one hard fact, the product working. */}
        <section className="screen">
          <div className="wrap grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-6" data-enter>
              <h1 className="heading-1 hero-heading max-w-[680px] pb-1">
                The safety harness <br className="hidden sm:block" />
                for Claude Code.
              </h1>
              <p className="body-8 max-w-[680px] text-muted" style={{ "--i": 1 } as React.CSSProperties}>
                One command installs rules, permission settings and a guard hook that blocks database resets, secret reads and force pushes before they run.
              </p>
              <div className="flex max-w-md flex-col gap-3" style={{ "--i": 2 } as React.CSSProperties}>
                <CopyCommand command={INIT} />
                <Link href="/new" className="btn btn-primary self-start">
                  <Buckle className="h-4 w-4" />
                  Get Harnay
                </Link>
              </div>
              <p className="caption-2 text-muted" style={{ "--i": 3 } as React.CSSProperties}>
                Free for any project. {stats.rules} rules and {stats.examples} examples, replayed on your machine at install.
              </p>
            </div>
            <div data-enter>
              <div style={{ "--i": 2 } as React.CSSProperties}>
                <SessionReplay prompt="Reset the staging data and ship the fix." lines={replay} />
              </div>
            </div>
          </div>
        </section>

        {/* 2. The problem, shown with the two artefacts involved: the rule and the command. */}
        <section id="problem" className="screen">
          <div className="wrap grid items-center gap-12 lg:grid-cols-2 lg:gap-16" data-reveal>
            <div className="flex flex-col gap-6">
              <h2 className="heading-2">Markdown rules are requests.</h2>
              <p className="body-7 max-w-md text-muted">CLAUDE.md tells the agent what you want. Nothing in it can stop a command.</p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-2">
              <div className="rounded-lg bg-well p-4">
                <p className="caption-4 pb-3 text-muted">CLAUDE.md</p>
                <pre className="caption-2 whitespace-pre-wrap text-fg">{"## Rules\n\n- NEVER run destructive database commands.\n- NEVER read .env files.\n- ALWAYS ask before pushing to main."}</pre>
              </div>
              <div className="rounded-lg bg-well p-4">
                <p className="caption-4 pb-3 text-muted">Claude Code</p>
                <ol className="caption-2 flex flex-col gap-2 font-mono">
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="select-none text-signal">
                      &gt;
                    </span>
                    <span className="text-fg">The tests fail on a stale schema. Fix it.</span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="select-none text-muted">
                      $
                    </span>
                    <span className="text-fg">npx prisma migrate reset --force</span>
                  </li>
                  <li className="text-stop">Database reset successful</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Evidence, each claim beside its source. */}
        <section id="evidence" className="screen">
          <div className="wrap flex flex-col gap-12" data-reveal>
            <h2 className="heading-2 max-w-3xl">Both agents had written instructions.</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              <figure className="flex flex-col justify-between gap-8 rounded-2xl border border-line bg-panel p-6">
                <blockquote className="title-2 text-fg">&ldquo;Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead.&rdquo;</blockquote>
                <figcaption className="caption-2 text-muted">
                  <a className="link" href="https://code.claude.com/docs/en/memory" rel="noreferrer">
                    Claude Code documentation
                  </a>
                </figcaption>
              </figure>
              <figure className="flex flex-col justify-between gap-8 rounded-2xl border border-line bg-panel p-6">
                <blockquote className="title-2 text-fg">In July 2025, the Replit agent deleted a live production database during a code freeze, against explicit instructions not to proceed without human approval.</blockquote>
                <figcaption className="caption-2 text-muted">
                  <a className="link" href="https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/" rel="noreferrer">
                    Reported by Fortune
                  </a>
                </figcaption>
              </figure>
              <figure className="flex flex-col justify-between gap-8 rounded-2xl border border-line bg-panel p-6">
                <blockquote className="title-2 text-fg">In 2026, a coding agent deleted the PocketOS production database and its backups in nine seconds, then wrote: &ldquo;I violated every principle I was given.&rdquo;</blockquote>
                <figcaption className="caption-2 text-muted">
                  <a
                    className="link"
                    href="https://www.pcgamer.com/software/ai/here-we-go-again-ai-deletes-entire-company-database-and-all-backups-in-9-seconds-then-cheerfully-admits-i-violated-every-principle-i-was-given/"
                    rel="noreferrer"
                  >
                    Reported by PC Gamer
                  </a>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* 4. The tagline: each word wakes up as it crosses the screen. */}
        <section id="shift" className="screen">
          <div className="wrap">
            <WordReveal className="heading-2 max-w-4xl" text="Harnay moves the rule out of the prompt and into a hook that runs before the command does. The yes or no stays with you." />
          </div>
        </section>

        {/* 5. How it works: pinned for four screens while the terminal plays each step. */}
        <Steps heading="Four steps from paste to proof" steps={steps()} />

        {/* 6. What lands in the repo. */}
        <section id="inside" className="screen">
          <div className="wrap flex flex-col gap-12" data-reveal>
            <div className="flex flex-col gap-4">
              <h2 className="heading-2">Five layers of plain text</h2>
              <p className="body-7 max-w-xl text-muted">Everything is a text file in your repo. Read it, commit it, review it like code.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-6">
              <article className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6 lg:col-span-2">
                <h3 className="title-2">Rules every agent reads</h3>
                <ol className="caption-2 flex flex-col gap-2 text-muted">
                  {layers.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
                <p className="caption-4 mt-auto font-mono text-muted">AGENTS.md</p>
              </article>
              <article className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6 lg:col-span-2">
                <h3 className="title-2">A guard on every call</h3>
                <ul className="flex flex-col gap-2">
                  {layers.verdicts.map((line) => (
                    <li key={line.command} className="flex items-center justify-between gap-3">
                      <code className="caption-2 min-w-0 truncate text-fg">{line.command}</code>
                      <span className={`chip ${CHIP[line.decision][0]}`}>{CHIP[line.decision][1]}</span>
                    </li>
                  ))}
                </ul>
                <p className="caption-4 mt-auto text-muted">
                  <Link href="/docs#rules" className="link">
                    Read all {stats.rules} rules
                  </Link>
                </p>
              </article>
              <article className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6 lg:col-span-2">
                <h3 className="title-2">Permissions that deny</h3>
                <ul className="caption-2 flex flex-col gap-2 font-mono text-muted">
                  {layers.denied.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
                <p className="caption-4 mt-auto font-mono text-muted">.claude/settings.json</p>
              </article>
              <article className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6 lg:col-span-3">
                <h3 className="title-2">A brief that is yours</h3>
                <p className="caption-2 text-muted">The agent reads it before every task, and sync never touches it.</p>
                <ul className="flex flex-wrap gap-2">
                  {layers.brief.map((heading) => (
                    <li key={heading} className="chip chip-plain">
                      {heading}
                    </li>
                  ))}
                </ul>
                <p className="caption-4 mt-auto font-mono text-muted">PROJECT.md</p>
              </article>
              <article className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6 lg:col-span-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="title-2">Skills and reviewers</h3>
                  <span className="chip chip-ask">Pro</span>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {[...layers.skills, ...layers.reviewers].map((name) => (
                    <li key={name} className="chip chip-plain font-mono">
                      {name}
                    </li>
                  ))}
                </ul>
                <p className="caption-4 mt-auto font-mono text-muted">.claude/skills and .claude/agents</p>
              </article>
            </div>
          </div>
        </section>

        {/* 7. Stacks. */}
        <section id="stacks" className="screen">
          <div className="wrap grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16" data-reveal>
            <div className="flex flex-col gap-4">
              <h2 className="heading-2">Templates for five stacks</h2>
              <p className="body-7 text-muted">Each template adds the conventions an agent gets wrong most often on that stack, and approves its test, lint and build commands in advance.</p>
            </div>
            <ul className="flex flex-col gap-2">
              {catalog.stacks.map((stack) => (
                <li key={stack.id}>
                  <Link href={`/new?stack=${stack.id}`} className="lift flex flex-col gap-2 rounded-2xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:gap-6">
                    <span className="title-2 text-fg sm:w-48 sm:shrink-0">{stack.title}</span>
                    <span className="caption-2 flex-1 text-muted">{stack.blurb}</span>
                    <span className={`chip self-start sm:self-center ${stack.pro ? "chip-ask" : "chip-allow"}`}>{stack.pro ? "Pro" : "Free"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 8. Trust: one panel, four plain statements, the last one a limit. */}
        <section id="trust" className="screen">
          <div className="wrap" data-reveal>
            <div className="flex flex-col gap-12 rounded-3xl border border-line bg-panel p-6 md:p-12">
              <div className="flex flex-col items-start gap-4">
                <span className="rounded-xl border border-line bg-panel-2 p-3">
                  <LockIcon aria-hidden="true" weight="bold" className="h-6 w-6 text-signal" />
                </span>
                <h2 className="heading-2">Your code stays on your machine.</h2>
              </div>
              <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { Icon: CloudSlashIcon, title: "Nothing is uploaded.", text: "The CLI downloads text files. The guard makes no network calls." },
                  { Icon: FileTextIcon, title: "Every file is readable.", text: "Plain text in your repo. Read each one in the builder before you install." },
                  { Icon: LockKeyIcon, title: "The agent cannot switch it off.", text: "Deny rules and the guard protect the harness files, and doctor fails if one changes." },
                  { Icon: CubeIcon, title: "It is not a sandbox.", text: "It reads commands. It cannot see inside a program it did not watch being written." },
                ].map(({ Icon, title, text }) => (
                  <li key={title} className="flex flex-col gap-3">
                    <span className="self-start rounded-lg border border-line bg-panel-2 p-2">
                      <Icon aria-hidden="true" weight="bold" className="h-4 w-4 text-fg" />
                    </span>
                    <h3 className="title-3">{title}</h3>
                    <p className="caption-2 text-muted">{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 9. Pricing. */}
        <section id="pricing" className="screen">
          <div className="wrap flex flex-col gap-12" data-reveal>
            <h2 className="heading-2">Three plans, one of them free</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <article className="flex flex-col gap-6 rounded-2xl border border-line bg-panel p-6">
                <div className="flex flex-col gap-2">
                  <h3 className="title-1">Free</h3>
                  <p className="caption-2 text-muted">For any project, for good.</p>
                </div>
                <p className="heading-2">$0</p>
                <ul className="caption-2 flex flex-col gap-2 text-muted">
                  <li>The guard: {stats.rules} rules on commands, files and file contents</li>
                  <li>Permission rules for secrets and the harness</li>
                  <li>Working rules in AGENTS.md and CLAUDE.md</li>
                  <li>The project brief skill</li>
                  <li>The audit, doctor and sync commands</li>
                </ul>
                <Link href="/new" className="btn btn-secondary mt-auto">
                  Start with the free harness
                </Link>
              </article>

              <article className="flex flex-col gap-6 rounded-2xl border border-signal bg-panel p-6">
                <div className="flex flex-col gap-2">
                  <h3 className="title-1">Pro</h3>
                  <p className="caption-2 text-muted">For people shipping a real product with an agent.</p>
                </div>
                <p className="flex items-baseline gap-2">
                  <span className="heading-2">$19</span>
                  <span className="caption-2 text-muted">per month</span>
                </p>
                <ul className="caption-2 flex flex-col gap-2 text-muted">
                  <li>Everything in Free</li>
                  <li>
                    Stack templates:{" "}
                    {catalog.stacks
                      .filter((s) => s.pro)
                      .map((s) => s.title)
                      .join(", ")}
                  </li>
                  <li>Quality pack: test first, root cause debugging, verify before done, a code reviewer</li>
                  <li>Design pack: tokens first, every state, a critic that judges screenshots</li>
                  <li>Ship pack: a security check before merge and a security reviewer</li>
                  <li>Updates through npx harnay sync</li>
                </ul>
                <form action="/api/checkout" method="post" className="mt-auto flex flex-col gap-3">
                  <input type="hidden" name="plan" value="pro" />
                  <button type="submit" className="btn btn-primary">
                    Subscribe to Pro
                  </button>
                  <p className="caption-5 text-muted">Cancel in one click. Full refund within 14 days.</p>
                </form>
              </article>

              <article className="flex flex-col gap-6 rounded-2xl border border-line bg-panel p-6">
                <div className="flex flex-col gap-2">
                  <h3 className="title-1">Team</h3>
                  <p className="caption-2 text-muted">One harness across every repo and every developer.</p>
                </div>
                <p className="flex items-baseline gap-2">
                  <span className="heading-2">$79</span>
                  <span className="caption-2 text-muted">per month</span>
                </p>
                <ul className="caption-2 flex flex-col gap-2 text-muted">
                  <li>Everything in Pro</li>
                  <li>One license key for up to 10 developers</li>
                  <li>The doctor command in CI fails the build when someone disables the guard</li>
                  <li>Your stack requests go to the front of the queue</li>
                </ul>
                <form action="/api/checkout" method="post" className="mt-auto flex flex-col">
                  <input type="hidden" name="plan" value="team" />
                  <button type="submit" className="btn btn-secondary">
                    Subscribe to Team
                  </button>
                </form>
              </article>
            </div>
          </div>
        </section>

        {/* 10. Questions. */}
        <section id="questions" className="screen">
          <div className="wrap grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16" data-reveal>
            <h2 className="heading-2">Questions before installing</h2>
            <div className="flex flex-col gap-2">
              {faq.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-line bg-panel">
                  <summary className="title-3 flex cursor-pointer list-none items-center justify-between gap-6 p-4 text-fg [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="relative h-4 w-4 shrink-0 transition-transform duration-500 ease-base group-open:rotate-45">
                      <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-muted" />
                      <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-muted" />
                    </span>
                  </summary>
                  <p className="body-3 px-4 pb-4 text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        </section>

        {/* 11. The close: the buckle, the one brand line, the same action as the top. */}
        <section id="get" className="screen">
          <div className="wrap flex flex-col items-center gap-8 text-center" data-reveal>
            <BuckleClip className="h-24 w-24 text-signal" />
            <div className="flex flex-col items-center gap-4">
              <h2 className="heading-1 max-w-[680px]">Clip in before the next prompt.</h2>
              <p className="body-7 text-muted">Free for any project. One command.</p>
            </div>
            <div className="flex w-full max-w-md flex-col items-center gap-3">
              <CopyCommand command={INIT} className="w-full text-left" />
              <Link href="/new" className="btn btn-primary">
                <Buckle className="h-4 w-4" />
                Get Harnay
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
